const { dbCon } = require("./../connection");
const { uuidCode } = require("../helpers/UUID");
const { default: axios } = require("axios");
const fs = require("fs");

const inputCartService = async (id, product_id, quantity) => {
  let conn, sql;
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

    sql = `SELECT id, product_id, quantity FROM cart WHERE user_id = ? AND is_deleted ='NO'`;
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

//get bank
const getBankService = async () => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    //get bank
    sql = `SELECT id, name, image FROM bank`;
    let [resultBank] = await conn.query(sql);

    await conn.commit();
    return resultBank;
  } catch (error) {
    console.log(error);
    await conn.rollback();
    throw new Error(error.message || error);
  } finally {
    conn.release();
  }
};

//delete cart
const deleteCartService = async (id) => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    //update is Deleted
    sql = `UPDATE cart SET is_deleted = "YES" WHERE id = ?`;
    await conn.query(sql, id);

    await conn.commit();
  } catch (error) {
    console.log(error);
    await conn.rollback();
    throw new Error(error.message || error);
  } finally {
    conn.release();
  }
};

const getFeeService = async (cityId) => {
  // the e-comm warehouse is in jakarta pusat, the id for jakarta pusat is 152
  console.log(cityId);
  try {
    let response = await axios.post(
      "https://api.rajaongkir.com/starter/cost",
      { origin: "152", destination: cityId, weight: 1000, courier: "jne" },
      {
        headers: { key: "2aa8392bfd96d0b0af0f4f7db657cd8e" },
      }
    );

    let deliveryFee =
      response.data.rajaongkir.results[0].costs[0].cost[0].value;
    return deliveryFee;
  } catch (error) {
    console.log(error.data);
    throw new Error(error.message || error);
  }
};

const checkoutService = async (data) => {
  let conn, sql;
  console.log(data, "ini data Service");
  const { checkoutProduct } = data;
  console.log(checkoutProduct, "cekoutproduk");
  // const data = {
  //   // transaction
  //   user_id,
  //   status,
  //   address,
  //   phone_number,
  //   recipient,
  //   delivery_fee,
  //   payment_slip,
  //   transaction_code,
  //   bank_id,
  //   delivery_fee,
  //   total_price,
  //   expired_at,
  // transaction detail
  // data array of object, yang terdiri dari name, quantity, price, image
  // };
  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    //runtutan checkout
    //1.check lagi count quantity stock product yang dibeli
    //2.throw error kalo misal udah ga sanggup kasih quantity yang diminta
    //3.kurangin quantity yang ada di stock dengan sejumlah yang di beli dengan tanggal kada luarsa lebih dulu.

    // check for the last time if the quantity is enough or not.
    sql = `SELECT SUM(quantity) total_product FROM stock WHERE product_id = ?`;

    for (let i = 0; i < checkoutProduct.length; i++) {
      const element = checkoutProduct[i];
      let [resultTotalQuantity] = await conn.query(sql, element.product_id);
      if (resultTotalQuantity[0].total_product < element.quantity) {
        throw "We're Sorry, the current product stock is not enough, please check back later.";
      }
    }

    // kurangin stock

    for (let i = 0; i < checkoutProduct.length; i++) {
      const element = checkoutProduct[i];
      let quantityCurent = element.quantity;
      // while () {
      sql = `SELECT quantity FROM stock WHERE product_id = ? AND quantity > 0 order by stock.expired_at ASC`;
      let [resultQuantity] = await conn.query(sql, element.product_id);
      resultQuantity[0];
      // }
    }

    // let [resultQuantity] = conn.query(sql, );

    return {};
  } catch (error) {
    console.log(error.data);
    throw new Error(error.message || error);
  }
};

module.exports = {
  inputCartService,
  getCartService,
  updateQuantityService,
  uploadPrescriptionService,
  getBankService,
  deleteCartService,
  getFeeService,
  checkoutService,
};
