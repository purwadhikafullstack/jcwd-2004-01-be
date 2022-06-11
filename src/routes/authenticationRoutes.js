const express = require("express");
const Router = express.Router();
const { verifyTokenAccess, verifyTokenEmail } = require("../lib/verifyToken");
const { authenticationController } = require("./../controllers");
const { register, login, keepLogin } = authenticationController;

Router.post("/register", register);
Router.post("/login", login);

module.exports = Router;