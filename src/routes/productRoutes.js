const express = require("express");
const Router = express.Router();
const {
  inputProductController,
  getCategory,
  getSymptom,
  getType,
  deleteProductController,
  getAllProductController,
  getProductController,
  editProductController,
  getCategoryList,
  getHomeProduct,
  getProductTerkaitController,
  inputCartController,
  getPrescriptionProduct,
  getQuantityProductController,
  updateStockController,
  getLogController,
  getProductsDiscount,
} = require("../controllers/productController");

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

Router.get("/get-category", getCategory);
Router.get("/get-symptom", getSymptom);
Router.get("/get-Type", getType);
Router.get("/get-products-discount", getProductsDiscount);
Router.patch("/delete-product", deleteProductController);
Router.get("/get-all-product", getAllProductController);
Router.get("/get-product", getProductController);
Router.get("/get-prescription-product", getPrescriptionProduct);
Router.patch(
  "/edit-product",
  verifyTokenAccess,
  uploader,
  editProductController
);
Router.get("/get-category-list", getCategoryList);
Router.get("/get-home-product", getHomeProduct);
Router.get("/get-product-terkait", getProductTerkaitController);
Router.post("/input-cart", verifyTokenAccess, inputCartController);
Router.post("/get-quantity-product", getQuantityProductController);
Router.post("/update-stock", verifyTokenAccess, updateStockController);
Router.get("/get-log", getLogController);

module.exports = Router;
