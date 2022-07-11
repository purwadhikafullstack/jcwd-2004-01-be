const express = require("express");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/verifyToken");
const { transactionController } = require("../controllers");
const {
  uploadPrescription,
  inputCartController,
  getCartController,
  updateQuantityController,
  getBankController,
  deleteCartController,
  checkoutController,
} = transactionController;
const upload = require("../lib/upload");
const { getFeeController } = require("../controllers/transactionController");

Router.post("/input-cart", verifyTokenAccess, inputCartController);
Router.get("/get-cart", verifyTokenAccess, getCartController);
Router.post("/update-quantity", verifyTokenAccess, updateQuantityController);

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

Router.get("/get-bank", getBankController);
Router.patch("/delete-cart", deleteCartController);
Router.get("/get-fee", getFeeController);
Router.post("/checkout", verifyTokenAccess, checkoutController);

module.exports = Router;
