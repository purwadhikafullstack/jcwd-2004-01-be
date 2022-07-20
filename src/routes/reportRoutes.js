const express = require("express");
const Router = express.Router();
const { verifyTokenAccess, verifyTokenEmail } = require("../lib/verifyToken");
const { verifyLastToken } = require("../lib/verifyLastToken");
const {
  getTodayReportController,
  getChartProfitController,
  getChartPenjualanController,
  getRingkasanStatistikController,
  getReportController,
  getChartPembatalanController,
} = require("../controllers/reportController");

Router.get("/get-today-report", getTodayReportController);
Router.get("/get-chart-profit", getChartProfitController);
Router.get("/get-chart-penjualan", getChartPenjualanController);
Router.get("/get-ringkasan-statistik", getRingkasanStatistikController);
Router.get("/get-report", getReportController);
Router.get("/get-chart-ditolak", getChartPembatalanController);

module.exports = Router;
