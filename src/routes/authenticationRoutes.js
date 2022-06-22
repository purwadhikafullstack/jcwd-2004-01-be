const express = require("express");
const Router = express.Router();
const { verifyTokenAccess, verifyTokenEmail } = require("../lib/verifyToken");
const { verifyLastToken } = require("../lib/verifyLastToken");
const { authenticationController } = require("./../controllers");
const {} = require("../controllers/authenticationController");
const {
  register,
  login,
  keepLogin,
  forgotPassword,
  resetForgotPassword,
  verifyMe,
  verifyAccount,
  checklRole,
  changeNewPassword,
} = authenticationController;

Router.post("/register", register); //TESTED AND WORKED
Router.post("/login", login); //TESTED AND WORKED
Router.get("/keeplogin", verifyTokenAccess, keepLogin); //TESTED AND WORKED
Router.post("/forgotpassword", forgotPassword); //TESTED AND WORKED
Router.post("/changepassword", verifyTokenAccess, changeNewPassword); //TESTED AND WORKED
Router.post("/resetpassword", verifyTokenEmail, resetForgotPassword); //TESTED AND WORKED
Router.get("/verifyme", verifyTokenAccess, verifyMe); //TESTED AND WORKED
Router.get("/verification", verifyTokenEmail, verifyLastToken, verifyAccount); //TESTED AND WORKED
Router.get("/check-role", verifyTokenAccess, checklRole); //TESTED AND WORKED

module.exports = Router;
