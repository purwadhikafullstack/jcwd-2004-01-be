const express = require("express");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/verifyToken");
const { userprofileController } = require("./../controllers");
const {
  updateUsername,
  updatePhonenumber,
  updateFullname,
  updateEmail,
  updateGender,
  updateBirthdate,
  getUpdatedUserprofileData,
} = userprofileController;

Router.post("/updateusername", verifyTokenAccess, updateUsername);
Router.post("/updatephonenumber", verifyTokenAccess, updatePhonenumber);
Router.post("/updatefullname", verifyTokenAccess, updateFullname);
Router.post("/updateemail", verifyTokenAccess, updateEmail);
Router.post("/updategender", verifyTokenAccess, updateGender);
Router.post("/updatebirthdate", verifyTokenAccess, updateBirthdate);
Router.get("/getuserprofile", verifyTokenAccess, getUpdatedUserprofileData);

module.exports = Router;
