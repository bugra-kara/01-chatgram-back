const CustomError = require('../errors');

const chechPermissions = (requestUser, resourceUserId) => {
  if (requestUser.role === 'admin') return;
  if (requestUser.userId === resourceUserId.toString()) return;
  res.status(100).json({result: "failed", msg: "Authentication Invalid"})
};

module.exports = chechPermissions;
