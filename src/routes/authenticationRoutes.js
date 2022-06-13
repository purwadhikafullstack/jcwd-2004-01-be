const express = require("express");
const Router = express.Router();
const { verifyTokenAccess, verifyTokenEmail } = require("../lib/verifyToken");
const { verifyLastToken } = require("../lib/verifyLastToken")
const { authenticationController } = require("./../controllers");
const { register, login, keepLogin, forgotPassword, resetPassword, sendEmailVerification} = authenticationController;

Router.post("/register", register);
Router.post("/login", login);
Router.post("/keeplogin", verifyTokenAccess, keepLogin);
Router.post("/forgotpassword", forgotPassword);
Router.post("/forgotpassword/resetpassword", verifyTokenEmail, resetPassword);
Router.get("/verifyme", verifyTokenAccess, sendEmailVerification);
Router.get("/verification", verifyTokenEmail, verifyLastToken, verifyTokenAccess);

module.exports = Router;