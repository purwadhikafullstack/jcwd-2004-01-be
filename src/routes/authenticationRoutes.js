const express = require("express");
const Router = express.Router();
const { verifyTokenAccess, verifyTokenEmail } = require("../lib/verifyToken");
const { verifyLastToken } = require("../lib/verifyLastToken");
const { authenticationController } = require("./../controllers");
const {
  register,
  login,
  keepLogin,
  forgotPassword,
  resetPassword,
  sendEmailVerification,
  verifyAccount,
  loginAdmin,
} = authenticationController;

Router.post("/register", register); //TESTED AND WORKED
Router.post("/login", login); //TESTED AND WORKED
Router.post("/login-admin", loginAdmin); //TESTED AND WORKED
Router.get("/keeplogin", verifyTokenAccess, keepLogin); //TESTED AND WORKED
Router.post("/forgotpassword", forgotPassword); //TESTED AND WORKED
Router.post("/forgotpassword/resetpassword", verifyTokenEmail, resetPassword);
Router.get("/verifyme", verifyTokenAccess, sendEmailVerification);
Router.get("/verification", verifyTokenEmail, verifyLastToken, verifyAccount); //TESTED AND WORKED

module.exports = Router;
