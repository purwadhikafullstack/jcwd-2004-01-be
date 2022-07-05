const { dbCon } = require("./../connection");
const { uuidCode } = require("../helpers/UUID");
const fs = require("fs");

const inputCartService = async (id, product_id, quantity) => {
  let conn, sql;
  // const { product_id, quantity, id } = props;
  console.log(product_id, "produk id", quantity, "quantity", id, "id");

  if (!quantity) {
    quantity = 1;
  } else {
    quantity = parseInt(quantity);
  }

  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    sql = `SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?`;
    let [haveProduct] = await conn.query(sql, [id, product_id]);

    let result;
    if (haveProduct.length) {
      let cartId = haveProduct[0].id;
      let currentQuantity = parseInt(haveProduct[0].quantity);
      quantity = currentQuantity + quantity;
      sql = `UPDATE cart SET quantity = ? WHERE id = ?`;
      [result] = await conn.query(sql, [quantity, cartId]);
    } else {
      sql = `INSERT INTO cart SET ?`;
      const dataProduct = {
        user_id: id,
        product_id,
        quantity,
      };
      [result] = await conn.query(sql, dataProduct);
    }

    conn.commit();
    return result[0];
  } catch (error) {
    console.log(error);
    conn.rollback();
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const getCartService = async (id) => {
  let conn, sql;
  let user_id = id;

  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    sql = `SELECT id, product_id, quantity FROM cart WHERE user_id = ?`;
    [data] = await conn.query(sql, user_id);

    sql = `SELECT image FROM product_image WHERE product_id = ? LIMIT 1`;
    for (let i = 0; i < data.length; i++) {
      let [resultImage] = await conn.query(sql, data[i].product_id);
      data[i] = { ...data[i], image: resultImage[0].image };
    }

    sql = `select sum(quantity) as total_stock FROM stock where product_id = ?`;
    for (let i = 0; i < data.length; i++) {
      let [quantityProdcut] = await conn.query(sql, data[i].product_id);
      data[i] = { ...data[i], maxInput: quantityProdcut[0].total_stock };
    }

    sql = `SELECT name, unit, price FROM product WHERE product.id = ?`;
    for (let i = 0; i < data.length; i++) {
      let [resultProdcut] = await conn.query(sql, data[i].product_id);
      data[i] = { ...data[i], detail_product: resultProdcut[0] };
    }

    console.log(data);

    conn.commit();
    return data;
  } catch (error) {
    console.log(error);
    conn.rollback();
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const updateQuantityService = async (currentQuantity, cart_id) => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    // if (currentQuantity == null) {
    //   console.log("null");
    //   currentQuantity = 1;
    // }

    sql = `UPDATE cart SET quantity = ? WHERE id = ?`;
    let [quantityProduct] = await conn.query(sql, [currentQuantity, cart_id]);

    conn.commit();
    return quantityProduct[0];
  } catch (error) {
    console.log(error);
    conn.rollback();
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

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
  inputCartService,
  getCartService,
  updateQuantityService,
  uploadPrescriptionService,
};
