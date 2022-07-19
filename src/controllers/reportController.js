const {
  getTodayReportService,
  getChartProfitService,
  getChartPenjualanService,
  getRingkasanStatistikService,
} = require("../services/reportService");

const getTodayReportController = async (req, res) => {
  try {
    let result = await getTodayReportService();

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

const getChartProfitController = async (req, res) => {
  const { filter, variant } = req.query;
  console.log(req.query);
  try {
    let result = await getChartProfitService(filter, variant);

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

const getChartPenjualanController = async (req, res) => {
  const filter = req.query;
  console.log(req.query);
  try {
    let result = await getChartPenjualanService(filter);

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

const getRingkasanStatistikController = async (req, res) => {
  try {
    let result = await getRingkasanStatistikService();

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

module.exports = {
  getTodayReportController,
  getChartProfitController,
  getChartPenjualanController,
  getRingkasanStatistikController,
};
