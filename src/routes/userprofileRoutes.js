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
  updateProfilePicture,
  deleteProfilePicture,
  getUpdatedUserprofileData,
} = userprofileController;
const upload = require("../lib/upload");

const uploader = upload("/photos", "ProfilePicture").single("profile_picture");

Router.post("/updateusername", verifyTokenAccess, updateUsername);
Router.post("/updatephonenumber", verifyTokenAccess, updatePhonenumber);
Router.post("/updatefullname", verifyTokenAccess, updateFullname);
Router.post("/updateemail", verifyTokenAccess, updateEmail);
Router.post("/updategender", verifyTokenAccess, updateGender);
Router.post("/updatebirthdate", verifyTokenAccess, updateBirthdate);
Router.post(
  "/updateprofilepicture",
  verifyTokenAccess,
  uploader,
  updateProfilePicture
);
Router.delete("/deleteprofilepicture", verifyTokenAccess, deleteProfilePicture);
Router.get("/getuserprofile", verifyTokenAccess, getUpdatedUserprofileData);

module.exports = Router;
