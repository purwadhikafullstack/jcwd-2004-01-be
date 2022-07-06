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
  getProvinces,
  getCities,
  addAddress,
  updateDefaultAddress,
} = userprofileController;
const upload = require("../lib/upload");
const {
  getAddress,
  getDefaultAddress,
} = require("../controllers/userprofileController");

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
Router.get("/getprovince", getProvinces);
Router.get("/getuseraddresses", verifyTokenAccess, getAddress);
Router.get("/getcity/:province_id", getCities);
Router.post("/addaddress", verifyTokenAccess, addAddress);
Router.patch(
  "/changedefaultaddress/:address_id",
  verifyTokenAccess,
  updateDefaultAddress
);
Router.get("/get-default-address", verifyTokenAccess, getDefaultAddress);

module.exports = Router;
