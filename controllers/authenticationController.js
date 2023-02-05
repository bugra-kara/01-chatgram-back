const User = require('../models/user');
const Token = require('../models/token')
const crypto = require('crypto');
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, UnauthenticatedError } = require('../errors')
const { attachCookiesToResponse, createTokenUser} = require('../utils');
const createHash = require('../utils/createHash')
const sendVerificationEmail = require('../utils/sendVerificationEmail')
const sendResetPasswordEmail = require('../utils/sendResetPasswordEmail')

const register = async (req, res) => {
  const {email, password, username} = req.body
  const emailAlreadyExists = await User.findOne({ email });
  const usernameExists = await User.findOne({username})
  if (emailAlreadyExists) {
    res.status(404).json({result: "failed", msg: "Email already exists"})
  }
  else if(usernameExists) {
    res.status(404).json({result: "failed", msg: "Username already exists"})
  }
  else {
    const verificationToken = crypto.randomBytes(40).toString('hex');
    const createUser = await User.create({
      username: username,
      email: email,
      password: password,
      verificationToken: verificationToken
    })
    /*
    const origin = "http://localhost:5000"
    await sendVerificationEmail({
      username: createUser.username,
      email: createUser.email,
      verificationToken: createUser.verificationToken,
      origin
    })*/
    res.status(StatusCodes.CREATED).json({result: "success" })
  }
}

const login = async (req, res) => {
  const {email, password} = req.body
  if (!email || !password) {
    res.json({result: "failed", msg: "Please provide email and password!"})
  }
  else {
    const user = await User.findOne({email})
    if (!user || user === null) {
      res.json({result: "failed", msg: "User didnt found!"})
    }
    else {
      const isPasswordCorrect = await user.comparePassword(password)
      if(!isPasswordCorrect){
        res.json({result: "failed", msg: "Wrong password!"})
      }
      else {
        /*if(!user.isVerified){
          res.status(100).json({result: "failed", msg: "Please verify your email!"})
        }*/
        const tokenUser = createTokenUser(user);
        // create refresh token
        let refreshToken = '';
        // check for existing token
        const existingToken = await Token.findOne({ user: user._id });
      
        if (existingToken) {
          const { isValid } = existingToken;
          if (!isValid) {
            res.json({result: "failed", msg: "Invalid Credentials"})
          }
          refreshToken = existingToken.refreshToken;
          attachCookiesToResponse({ res, user: tokenUser, refreshToken });
          res.json({result: "success", data: {username: user.username, userId: user._id}});
          return;
        }
        else {
          refreshToken = crypto.randomBytes(40).toString('hex');
          const useragent = req.headers['user-agent'];
          const ip = req.ip;
          const userToken = { refreshToken, ip, useragent, user: user._id };
          await Token.create(userToken);
          attachCookiesToResponse({ res, user: tokenUser, refreshToken });
          res.json({result: "success", data: {username: user.username, userId: user._id}});
        }
      }
    }
  }
}

const logout = async (req, res) => {
  res.cookie('accessToken', 'logout', {
      httpOnly: false,
      expires: new Date(Date.now()),
    });
  res.cookie('refreshToken', 'logout', {
      httpOnly: false,
      expires: new Date(Date.now()),
    });
  res.status(StatusCodes.OK).json({result: "success"});
}

const verifyEmail = async (req, res) => {
  const {token, email} = req.query
  const user = await User.find({email: email})
  if(user[0].isVerified){
    res.status(100).json({result: "failed", msg: "Already verified!"})
  }
  if(!user) {
    res.status(100).json({result: "failed", msg: "Wrong email!"})
  }
  if(!(user[0].verificationToken === token)){
    res.status(100).json({result: "failed", msg: "Wrong token!"})
  }
  await User.updateMany(
    {
      email: user[0].email
    },
    {
      isVerified : true,
      verified : Date.now(),
      verificationToken : ''
    }
  )
  res.status(StatusCodes.ACCEPTED).json({result: "success"})
}

const resetPassword = async (req, res) => {
  const {token, email } = req.query
  const { password } = req.body

  if (!token || !email || !password) {
    res.status(100).json({result: "failed", msg: "Please provide all values!"})
  }
  const user = await User.find({email: email})
  if (user) {
    const currentDate = new Date();
    if (
      user[0].passwordToken === createHash(token) &&
      user[0].passwordTokenExpirationDate > currentDate
    ) {
      user[0].password = password
      user[0].passwordToken = null
      user[0].passwordTokenExpirationDate = null
      await user[0].save()
    }
  }
  res.status(StatusCodes.ACCEPTED).json({result: "success"})
}

const forgotPassword = async (req, res) => {
  const {email} =  req.body
  if (!email) {
    res.status(100).json({result: "failed", msg: "Please provide valid email!"})
  }
  const user = await User.find({email: email})
  if (user) {
    const passwordToken = crypto.randomBytes(70).toString('hex');
    // send email
    const origin = process.env.ORIGIN;
    await sendResetPasswordEmail({
      username: user[0].username,
      email: user[0].email,
      token: passwordToken,
      origin,
    });
    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);
    const hashPassword = createHash(passwordToken)
    await User.updateMany(
      {
        email:user[0].email
      },
      {
      passwordToken : hashPassword,
      passwordTokenExpirationDate : passwordTokenExpirationDate
      }
    )
  }
  res
    .status(StatusCodes.OK)
    .json({ result: "success" });
}

module.exports = {
    register,
    login,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword
}