const jwt = require('jsonwebtoken');

const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
  return token;
};

const isTokenValid = (token) => {
  let verifiedToken
  try {
    verifiedToken = jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    if(error) {
      return 400
    }
    console.log(error);
  }
  return verifiedToken
}

const attachCookiesToResponse = ({ res, user, refreshToken }) => {
  const accessTokenJWT = createJWT({ payload: { user } });
  const refreshTokenJWT = createJWT({ payload: { user, refreshToken } });
  console.log(res, user);
  const oneDay = 1000 * 60 * 60 * 24;
  const longerExp = 1000 * 60 * 60 * 24 * 30;
  res.cookie('accessToken', accessTokenJWT, {
    secure: false,
    httpOnly: false,
    sameSite: "none",
    expires: new Date(Date.now() + oneDay),
  });

  res.cookie('refreshToken', refreshTokenJWT, {
    secure: false,
    httpOnly: false,
    sameSite: "none",
    expires: new Date(Date.now() + longerExp),
  });
};

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
};
