const express = require("express");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/verifyToken");
const { transactionController } = require("../controllers");
const {
  uploadPrescription,
  inputCartController,
  getCartController,
  updateQuantityController,
  getPrescriptionTransactionList,
  submitPrescriptionCopy,
  acceptOrder,
  rejectOrder,
  getTransactionDetailProduct,
  getTransactionListUser,
} = transactionController;
const upload = require("../lib/upload");

Router.post("/input-cart", verifyTokenAccess, inputCartController);
Router.get("/get-cart", verifyTokenAccess, getCartController);
Router.post("/update-quantity", verifyTokenAccess, updateQuantityController);
Router.get(
  "/get-transaction-prescription-list",
  getPrescriptionTransactionList
);
Router.get("/get-transaction-user-list", getTransactionListUser);

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

Router.post("/submitprescription/:transaction_id", submitPrescriptionCopy);
Router.post("/acceptorder/:transaction_id", acceptOrder);
Router.post("/rejectorder/:transaction_id", rejectOrder);
Router.get("/transaction-detail/:transaction_id", getTransactionDetailProduct);

module.exports = Router;
