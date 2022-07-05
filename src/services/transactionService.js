const { dbCon } = require("./../connection");
const fs = require("fs");
const { uuidCode } = require("../helpers/UUID");

//Upload Prescription Service
const uploadPrescriptionService = async (img, id) => {
  let conn, sql;
  let path = "/prescription";
  const imagePath = img
    ? img.map((val) => {
        return `${path}/${val.filename}`;
      })
    : [];

  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();

    //Get Address Data ( MASIH PAKE DEFAULT ADDRESS )
    sql = `select address, recipient_name, recipient_number, province_id, city_id from address where user_id = ? and is_default = "YES"`;
    let [userAddress] = await conn.query(sql, id);

    //Insert to transaction table
    let insertData = {
      user_id: id,
      address: userAddress[0].address,
      status: 0,
      phone_number: userAddress[0].recipient_number,
      recipient: userAddress[0].recipient_name,
      transaction_code: uuidCode("TRA"),
    };

    sql = `insert into transaction set ?`;
    let [userTransaction] = await conn.query(sql, insertData);

    //Insert to prescription table
    sql = `insert into prescription set ?`;
    for (let i = 0; i < imagePath.length; i++) {
      let val = imagePath[i];
      let insertDataImage = {
        img: val,
        transaction_id: userTransaction.insertId,
        user_id: id,
        status: 0,
        prescription_code: uuidCode("PRS"),
      };
      await conn.query(sql, insertDataImage);
    }

    //Checking
    sql = `select * from prescription where user_id = ?`;
    let [check] = await conn.query(sql, id);

    sql = `select * from transaction where user_id = ?`;
    let [check1] = await conn.query(sql, id);

    await conn.commit();
    conn.release;
    return { check, check1 };
  } catch (error) {
    console.log(error);
    await conn.rollback();
    conn.release();
    throw new Error(error.message || error);
  }
};

module.exports = {
  uploadPrescriptionService,
};
