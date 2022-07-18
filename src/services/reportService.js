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

    let yesterdayStock =
      parseInt(totalStock[0].total_stock) - parseInt(totalStock[0].moved_stock);

    let stockPrecentageDifference = Math.round(
      (parseInt(totalStock[0].moved_stock) / yesterdayStock) * 100
    );

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

const getChartProfitService = async ({ filter }) => {
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
      for (let i = 1; i < 12; i++) {
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
        for (let i = 0; i < todayTransaction.length; i++) {
          const { price, original_price, quantity } = todayTransaction[i];
          thisMonthProfit += price * quantity - original_price * quantity;
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
        for (let i = 0; i < todayTransaction.length; i++) {
          const { price, original_price, quantity } = todayTransaction[i];
          thisMonthProfit += price * quantity - original_price * quantity;
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

module.exports = {
  getTodayReportService,
  getChartProfitService,
};
