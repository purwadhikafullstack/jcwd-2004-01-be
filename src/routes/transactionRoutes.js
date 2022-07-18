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
  getPrescriptionTransactionList,
  submitPrescriptionCopy,
  acceptOrder,
  rejectPrescription,
  getTransactionDetailProduct,
  getTransactionListUser,
  uploadSlipPayment,
  rejectOrder,
  sendOrder,
  acceptOrderUser,
} = transactionController;
const upload = require("../lib/upload");
const { getFeeController } = require("../controllers/transactionController");

const uploader = upload("/paymentslip", "Payment_Slip").single("payment_slip");

Router.post("/input-cart", verifyTokenAccess, inputCartController);
Router.get("/get-cart", verifyTokenAccess, getCartController);
Router.post("/update-quantity", verifyTokenAccess, updateQuantityController);
Router.get(
  "/get-transaction-prescription-list",
  getPrescriptionTransactionList
);
Router.get(
  "/get-transaction-user-list",
  verifyTokenAccess,
  getTransactionListUser
);

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
Router.post(
  "/submitprescription/:transaction_id",
  verifyTokenAccess,
  submitPrescriptionCopy
);
Router.post("/acceptorder/:transaction_id", acceptOrder);
Router.post("/rejectprescription/:transaction_id", rejectPrescription);
Router.post("/sendorder/:transaction_id", sendOrder);
Router.post("/acceptorderuser/:transaction_id", acceptOrderUser);
Router.post("/rejectorder/:transaction_id", verifyTokenAccess, rejectOrder);
Router.get("/transaction-detail/:transaction_id", getTransactionDetailProduct);
Router.post(
  "/upload-slip-payment/:transaction_id",
  uploader,
  uploadSlipPayment
);

module.exports = Router;
