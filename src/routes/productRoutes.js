const express = require("express");
const Router = express.Router();
const { inputProductController } = require("../controllers/productController");

const upload = require("../lib/upload");
const { verifyTokenAccess } = require("../lib/verifyToken");
const uploader = upload("/image", "PRODUCTIMAGE").fields([
  { name: "image", maxCount: 3 },
]);

Router.post(
  "/input-product",
  verifyTokenAccess,
  uploader,
  inputProductController
);

module.exports = Router;
