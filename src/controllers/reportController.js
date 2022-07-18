const {
  getTodayReportService,
  getChartProfitService,
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
  const filter = req.query;
  console.log(req.query);
  try {
    let result = await getChartProfitService(filter);

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

module.exports = {
  getTodayReportController,
  getChartProfitController,
};
