const express = require("express");
const Router = express.Router();
const { verifyTokenAccess, verifyTokenEmail } = require("../lib/verifyToken");
const { verifyLastToken } = require("../lib/verifyLastToken");
const {
  getTodayReportController,
  getChartProfitController,
} = require("../controllers/reportController");

Router.get("/get-today-report", getTodayReportController);
Router.get("/get-chart-profit", getChartProfitController);

module.exports = Router;
