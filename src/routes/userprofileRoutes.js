const express = require("express");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/verifyToken");
const { userprofileController } = require("./../controllers");
const { updateUsername } = userprofileController;

Router.post("/updateusername", verifyTokenAccess, updateUsername);

module.exports = Router;
