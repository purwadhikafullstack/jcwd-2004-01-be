const express = require("express");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/verifyToken");
const { transactionController } = require("../controllers");
const { uploadPrescription } = transactionController;
const upload = require("../lib/upload");

const uploaderPrescription = upload(
  "/prescription",
  "PRESCRIPTION_IMAGE"
).fields([{ name: "img", maxCount: 5 }]);

Router.post(
  "/prescriptionupload",
  verifyTokenAccess,
  uploaderPrescription,
  uploadPrescription
);

module.exports = Router;
