const jwt = require("jsonwebtoken");

//Token Access
const createJwtAccess = (data) => {
  return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "24h" });
};

//Token Email
const createJwtEmail = (data) => {
  return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "30m" });
};

module.exports = {
  createJwtAccess,
  createJwtEmail,
};
