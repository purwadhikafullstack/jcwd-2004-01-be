const { dbCon } = require("./../connection");
const { default: axios } = require("axios");
const { uuidCode, codeGenerator } = require("../helpers/UUID");
const fs = require("fs");
const dayjs = require("dayjs");

// const get profit hari ini

const getTodayReportService = async () => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    //calculate today profit
    //select today transaction WHERE selesai

    sql = `SELECT id FROM transaction WHERE status = 'SELESAI' AND DATE(updated_at) = CURDATE()`;
    let [todayTransaction] = await conn.query(sql);

    sql = `SELECT quantity, price, original_price FROM transaction_detail WHERE transaction_id = ?`;
    for (let i = 0; i < todayTransaction.length; i++) {
      let [resultTransactionDetail] = await conn.query(
        sql,
        todayTransaction[i].id
      );
      todayTransaction[i] = {
        ...todayTransaction[i],
        ...resultTransactionDetail[0],
      };
    }

    let todayProfit = 0;
    for (let i = 0; i < todayTransaction.length; i++) {
      const { price, original_price, quantity } = todayTransaction[i];
      todayProfit += price * quantity - original_price * quantity;
    }

    // select yesterdat transaction WHERE selesai
    sql = `SELECT id FROM transaction WHERE status = 'SELESAI' AND DATE(updated_at) = SUBDATE(CURDATE(),1)`;
    let [yesterdayTransaction] = await conn.query(sql);

    sql = `SELECT quantity, price, original_price FROM transaction_detail WHERE transaction_id = ?`;
    for (let i = 0; i < yesterdayTransaction.length; i++) {
      let [resultTransactionDetail] = await conn.query(
        sql,
        yesterdayTransaction[i].id
      );
      yesterdayTransaction[i] = {
        ...yesterdayTransaction[i],
        ...resultTransactionDetail[0],
      };
    }

    let yesterdayProfit = 0;
    for (let i = 0; i < yesterdayTransaction.length; i++) {
      const { price, original_price, quantity } = yesterdayTransaction[i];
      yesterdayProfit += price * quantity - original_price * quantity;
    }

    let profitDifference = todayProfit - yesterdayProfit;
    let precentageDifference;
    if (yesterdayProfit == 0) {
      precentageDifference = 100;
    } else {
      precentageDifference = Math.round(
        (profitDifference / yesterdayProfit) * 100
      );
    }

    // calculate today pemesanan
    // today transaction
    sql = `SELECT COUNT(*) as total_transaction FROM (SELECT id FROM transaction WHERE DATE(created_at) = CURDATE())as total_today`;
    let [totalTransactionToday] = await conn.query(sql);
    console.log(totalTransactionToday[0]);
    let totalToday = totalTransactionToday[0].total_transaction;

    // yesterdat transaction
    sql = `SELECT COUNT(*) as total_transaction FROM (SELECT * FROM transaction WHERE DATE(created_at) = SUBDATE(CURDATE(),1)) as total_yesterday`;
    let [totalTransactionYesterday] = await conn.query(sql);
    console.log(totalTransactionYesterday[0]);
    let totalYesterday = totalTransactionYesterday[0].total_transaction;

    let totalTrasactionDifference = totalToday - totalYesterday;
    let precentageTotalDifference;
    if (totalYesterday == 0) {
      precentageTotalDifference = 100;
    } else {
      precentageTotalDifference = Math.round(
        (totalTrasactionDifference / totalYesterday) * 100
      );
    }

    // sisa stock hari ini bingung bat ini, bentar yak
    sql = `SELECT 
    (SELECT SUM(quantity) FROM stock) as total_stock,
    (SELECT SUM(quantity) FROM log WHERE DATE(created_at) = SUBDATE(CURDATE(),1)) as moved_stock`;

    let [totalStock] = await conn.query(sql);

    let stockPrecentageDifference = 0;
    if (totalStock[0].moved_stock == null) {
      stockPrecentageDifference = 0;
      totalStock[0].moved_stock = 0;
    } else {
      let yesterdayStock =
        parseInt(totalStock[0].total_stock) -
        parseInt(totalStock[0].moved_stock);

      stockPrecentageDifference = Math.round(
        (parseInt(totalStock[0].moved_stock) / yesterdayStock) * 100
      );
    }

    // kadaluarsa
    sql = `SELECT
    (SELECT SUM(quantity) FROM stock WHERE expired_at <= CURDATE()) as expired,
    (SELECT SUM(quantity) FROM stock WHERE MONTH(expired_at) = MONTH(CURRENT_DATE()) AND YEAR(expired_at) = YEAR(CURRENT_DATE())) as expired_this_month,
    (SELECT SUM(quantity) FROM stock WHERE expired_at >= CURDATE() AND expired_at <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH)) as three_month_expired;`;

    let [expiredProduct] = await conn.query(sql);

    // Penting hari ini
    sql = `SELECT (SELECT COUNT(*) FROM transaction WHERE status IN('MENUNGGU_KONFIRMASI', 'MENUNGGU_PEMBAYARAN') AND DATE(updated_at) = CURDATE()) as pesanan_baru,
    (SELECT COUNT(*) FROM transaction WHERE status = 'DIPROSES' AND DATE(updated_at) = CURDATE()) as siap_dikirim,
    (SELECT COUNT(*) FROM transaction WHERE status = 'DIKIRIM' AND DATE(updated_at) = CURDATE()) as sedang_dikirim,
    (SELECT COUNT(*) FROM transaction WHERE status = 'SELESAI' AND DATE(updated_at) = CURDATE()) as selesai,
    (SELECT COUNT(*) FROM transaction WHERE status = 'DITOLAK' AND DATE(updated_at) = CURDATE()) as dibatalkan`;

    let [importantToday] = await conn.query(sql);

    let result = {
      profit: {
        todayProfit,
        profitDifference,
        precentageDifference,
      },
      transaction: {
        totalToday,
        totalTrasactionDifference,
        precentageTotalDifference,
      },
      expired: { ...expiredProduct[0] },
      importantToday: { ...importantToday[0] },
      totalStock: {
        stockToday: parseInt(totalStock[0].total_stock),
        stockDifference: parseInt(totalStock[0].moved_stock),
        stockPrecentageDifference,
      },
    };

    console.log(result, "ini result");
    await conn.commit();
    return { result, message: "Success get report!" };
  } catch (error) {
    console.log(error);
    conn.rollback();
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const getChartProfitService = async (filter, variant) => {
  let conn, sql;
  console.log(filter, "ini filter");

  let year = new Date().getFullYear();
  let month = new Date().getMonth();
  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    let data = [];
    let label = [];
    if (filter == "bulan") {
      for (let i = 1; i < 13; i++) {
        if (i != 12) {
          sql = `SELECT * FROM transaction WHERE status = 'SELESAI' AND updated_at >= '${year}-${i}-01' AND updated_at <= '${year}-${
            i + 1
          }-01'`;
        } else {
          sql = `SELECT * FROM transaction WHERE status = 'SELESAI' AND updated_at >= '${year}-${i}-01' AND updated_at <= '${
            year + 1
          }-01-01'`;
        }
        let [todayTransaction] = await conn.query(sql);

        sql = `SELECT quantity, price, original_price FROM transaction_detail WHERE transaction_id = ?`;
        for (let i = 0; i < todayTransaction.length; i++) {
          let [resultTransactionDetail] = await conn.query(
            sql,
            todayTransaction[i].id
          );
          todayTransaction[i] = {
            ...todayTransaction[i],
            ...resultTransactionDetail[0],
          };
        }

        let thisMonthProfit = 0;
        if (variant == "gross") {
          for (let i = 0; i < todayTransaction.length; i++) {
            const { price, quantity } = todayTransaction[i];
            thisMonthProfit += price * quantity;
          }
        } else {
          for (let i = 0; i < todayTransaction.length; i++) {
            const { price, original_price, quantity } = todayTransaction[i];
            thisMonthProfit += price * quantity - original_price * quantity;
          }
        }
        data.push(thisMonthProfit);
        label = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
      }
    }

    if (filter == "tahun") {
      for (let i = -1; i < 4; i++) {
        sql = `SELECT * FROM transaction WHERE status = 'SELESAI' AND updated_at >= '${
          year - i - 1
        }-01-01' AND updated_at < '${year - i}-01-01'`;
        let [todayTransaction] = await conn.query(sql);

        sql = `SELECT quantity, price, original_price FROM transaction_detail WHERE transaction_id = ?`;
        for (let i = 0; i < todayTransaction.length; i++) {
          let [resultTransactionDetail] = await conn.query(
            sql,
            todayTransaction[i].id
          );
          todayTransaction[i] = {
            ...todayTransaction[i],
            ...resultTransactionDetail[0],
          };
        }

        let thisMonthProfit = 0;
        if (variant == "gross") {
          for (let i = 0; i < todayTransaction.length; i++) {
            const { price, quantity } = todayTransaction[i];
            thisMonthProfit += price * quantity;
          }
        } else {
          for (let i = 0; i < todayTransaction.length; i++) {
            const { price, original_price, quantity } = todayTransaction[i];
            thisMonthProfit += price * quantity - original_price * quantity;
          }
        }
        data.unshift(thisMonthProfit);
        label.unshift(year - i - 1);
      }
    }

    await conn.commit();
    return { data, label, message: "Success get chart profit!" };
  } catch (error) {
    console.log(error);
    conn.rollback();
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const getChartPenjualanService = async ({ filter }) => {
  let conn, sql;
  console.log(filter, "ini filter");

  let year = new Date().getFullYear();
  let month = new Date().getMonth();
  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    let data = [];
    let label = [];
    let average = 0;
    if (filter == "bulan") {
      for (let i = 1; i < 13; i++) {
        if (i != 12) {
          sql = `SELECT * FROM transaction WHERE status = 'SELESAI' AND updated_at >= '${year}-${i}-01' AND updated_at <= '${year}-${
            i + 1
          }-01'`;
        } else {
          sql = `SELECT * FROM transaction WHERE status = 'SELESAI' AND updated_at >= '${year}-${i}-01' AND updated_at <= '${
            year + 1
          }-01-01'`;
        }
        let [todayTransaction] = await conn.query(sql);

        sql = `SELECT quantity FROM transaction_detail WHERE transaction_id = ?`;
        for (let i = 0; i < todayTransaction.length; i++) {
          let [resultTransactionDetail] = await conn.query(
            sql,
            todayTransaction[i].id
          );
          todayTransaction[i] = {
            ...todayTransaction[i],
            ...resultTransactionDetail[0],
          };
        }

        let thisMonthSells = 0;
        for (let i = 0; i < todayTransaction.length; i++) {
          const { quantity } = todayTransaction[i];
          thisMonthSells += quantity;
        }
        data.push(thisMonthSells);
        label = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
      }
      average = Math.floor(data.reduce((a, b) => a + b, 0) / data.length);
    }

    if (filter == "tahun") {
      for (let i = -1; i < 4; i++) {
        sql = `SELECT * FROM transaction WHERE status = 'SELESAI' AND updated_at >= '${
          year - i - 1
        }-01-01' AND updated_at < '${year - i}-01-01'`;
        let [todayTransaction] = await conn.query(sql);

        sql = `SELECT quantity FROM transaction_detail WHERE transaction_id = ?`;
        for (let i = 0; i < todayTransaction.length; i++) {
          let [resultTransactionDetail] = await conn.query(
            sql,
            todayTransaction[i].id
          );
          todayTransaction[i] = {
            ...todayTransaction[i],
            ...resultTransactionDetail[0],
          };
        }

        let thisMonthSells = 0;
        for (let i = 0; i < todayTransaction.length; i++) {
          const { quantity } = todayTransaction[i];
          thisMonthSells += quantity;
        }
        data.unshift(thisMonthSells);
        label.unshift(year - i - 1);
      }
      average = Math.floor(data.reduce((a, b) => a + b, 0) / data.length);
    }

    await conn.commit();
    return { data, label, average, message: "Success get chart profit!" };
  } catch (error) {
    console.log(error);
    conn.rollback();
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const getRingkasanStatistikService = async () => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    // Penting hari ini
    sql = ``;

    let [importantToday] = await conn.query(sql);

    await conn.commit();
    return {
      data: importantToday[0],
      message: "Success get Ringkasan Statistik!",
    };
  } catch (error) {
    console.log(error);
    conn.rollback();
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const getChartPembatalanService = async (filter) => {
  let conn, sql;

  let year = new Date().getFullYear();
  let month = new Date().getMonth();

  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    let data = [];
    let label = [];
    // Penting hari ini
    if (filter == "bulan") {
      for (let i = 1; i < 13; i++) {
        if (i != 12) {
          sql = `SELECT COUNT(*) as total_ditolak FROM transaction WHERE status = 'DITOLAK' AND updated_at >= '${year}-${i}-01' AND updated_at <= '${year}-${
            i + 1
          }-01'`;
        } else {
          sql = `SELECT COUNT(*) as total_ditolak FROM transaction WHERE status = 'DITOLAK' AND updated_at >= '${year}-${i}-01' AND updated_at <= '${
            year + 1
          }-01-01'`;
        }
        let [resultDitolak] = await conn.query(sql);
        data.push(resultDitolak[0].total_ditolak);
      }
      label = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
    }

    if (filter == "tahun") {
      for (let i = -1; i < 4; i++) {
        sql = `SELECT COUNT(*) as total_ditolak FROM transaction WHERE status = 'DITOLAK' AND updated_at >= '${
          year - i - 1
        }-01-01' AND updated_at < '${year - i}-01-01'`;
        let [resultDitolak] = await conn.query(sql);
        data.unshift(resultDitolak[0].total_ditolak);
        label.unshift(year - i - 1);
      }
    }

    await conn.commit();
    return {
      data,
      label,
      message: "Success get Ringkasan Statistik!",
    };
  } catch (error) {
    console.log(error);
    conn.rollback();
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const getReportService = async (periode, year, month) => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    // Penting hari ini
    if (periode == "bulanan") {
      sql = `SELECT sum(capital) as total_capital, sum(gross_sale) as total_gross_sale, sum(net_profit)  as total_net_profit FROM report WHERE YEAR(updated_at) = ${year} AND MONTH(updated_at) = ${month}`;
    } else if (periode == "tahunan") {
      sql = `SELECT sum(capital) as total_capital, sum(gross_sale) as total_gross_sale, sum(net_profit)  as total_net_profit FROM report WHERE YEAR(updated_at) = ${year}`;
    }

    let [report] = await conn.query(sql);

    if (
      report[0].total_capital == null ||
      report[0].total_gross_sale == null ||
      report[0].total_net_profit == null
    ) {
      throw "No Data.";
    }

    await conn.commit();
    return {
      result: report[0],
      message: "Success get laporan laba rugi!",
    };
  } catch (error) {
    console.log(error);
    conn.rollback();
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

module.exports = {
  getTodayReportService,
  getChartProfitService,
  getChartPenjualanService,
  getRingkasanStatistikService,
  getChartPembatalanService,
  getReportService,
};
