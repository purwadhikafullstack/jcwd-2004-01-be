const jwt = require("jsonwebtoken");

//Token Access
const createJwtAccess = (data) => {
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "6h" });
};

//Token Email
const createJwtEmail = (data) => {
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "5m" });
};

module.exports = {
  createJwtAccess,
  createJwtEmail
};