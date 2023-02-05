const { isTokenValid } = require('../utils');
const { attachCookiesToResponse } = require('../utils');
const Token = require('../models/token')
const User = require('../models/user')
const auth = async (req, res, next) => {
  const { refreshToken, accessToken } = req.cookies;
  try {
    if( refreshToken === undefined || accessToken === undefined) {
      res.json({result: "failed", msg: "Authentication Invalid1"})
    }
    else {
      if (accessToken) {
        const payload = isTokenValid(accessToken);
        req.user = payload.user;
        return next();
      }
      const payload = isTokenValid(refreshToken);
      const existingToken = await Token.findOne({
        user: payload.user.userId,
        refreshToken: payload.refreshToken,
      });
      if (!existingToken || !existingToken?.isValid) {
        res.status(100).json({result: "failed", msg: "Authentication Invalid2"})
      }
  
      attachCookiesToResponse({
        res,
        user: payload.user,
        refreshToken: existingToken.refreshToken,
      });
  
      req.user = payload.user;
      next();
    }
  } catch (error) {
    res.status(100).json({result: "failed", msg: "Authentication Invalid3"})
  }
}
const authorizePermissions = async (...roles) => {
  
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(100).json({result: "failed", msg: "Authentication Invalid"})
    }
    next();
  };
};
module.exports = {auth, authorizePermissions}