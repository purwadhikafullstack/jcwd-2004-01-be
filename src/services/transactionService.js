const { dbCon } = require("./../connection");
const { default: axios } = require("axios");
const { uuidCode, codeGenerator } = require("../helpers/UUID");
const fs = require("fs");
const dayjs = require("dayjs");

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

    sql = `SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND is_deleted = 'NO'`;
    let [haveProduct] = await conn.query(sql, [id, product_id]);

    console.log(haveProduct, "haveproduct WOOOOOOOOOOOOOOOO");

    let result;
    if (haveProduct.length) {
      let cartId = haveProduct[0].id;
      let currentQuantity = parseInt(haveProduct[0].quantity);
      quantity = currentQuantity + quantity;
      sql = `UPDATE cart SET quantity = ? WHERE id = ?`;
      [result] = await conn.query(sql, [quantity, cartId]);
    } else {
      console.log("ini masuk ke else");
      sql = `INSERT INTO cart SET ?`;
      const dataProduct = {
        user_id: id,
        product_id,
        quantity,
      };
      [result] = await conn.query(sql, dataProduct);
    }

    await conn.commit();
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
      status: 1,
      phone_number: userAddress[0].recipient_number,
      recipient: userAddress[0].recipient_name,
      transaction_code: codeGenerator("TRA", id),
      expired_at: dayjs(new Date()).add(2, "day").format("YYYY-MM-DD HH:mm:ss"),
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
        status: 3,
        prescription_code: uuidCode("PRS"),
        expired_at: dayjs(new Date())
          .add(2, "day")
          .format("YYYY-MM-DD HH:mm:ss"),
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

const checkoutService = async (data, id) => {
  let conn, sql;
  console.log(data, "ini data Service");
  const { checkoutProduct } = data;
  console.log(data);
  console.log(checkoutProduct, "cekoutproduk");

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
      let { product_id, quantity } = checkoutProduct[i];

      //Input Into Tabel Transaction
      sql = `INSERT INTO transaction SET ?`;
      let updateTransaction = {
        bank_id: data.bank_id,
        status: 1,
        user_id: id,
        address: data.address,
        phone_number: data.phone_number,
        recipient: data.recipient,
        delivery_fee: data.delivery_fee,
        total_price: data.total_price,
        transaction_code: codeGenerator("TRA", data.phone_number),
        expired_at: dayjs(new Date())
          .add(1, "day")
          .format("YYYY-MM-DD HH:mm:ss"),
      };
      let [resultTransaction] = await conn.query(sql, updateTransaction);

      let transaction_id = resultTransaction.insertId;

      //input into transaction detail
      for (let i = 0; i < checkoutProduct.length; i++) {
        sql = `INSERT INTO transaction_detail SET ?`;
        const { detail_product, quantity, image } = checkoutProduct[i];
        let dataTransactionDetail = {
          transaction_id,
          name: detail_product.name,
          quantity,
          price: detail_product.price,
          image,
        };
        await conn.query(sql, dataTransactionDetail);
      }

      sql = `SELECT quantity, id FROM stock WHERE product_id = ? AND quantity > 0 order by stock.expired_at ASC`;
      let [stockQuantity] = await conn.query(sql, product_id);
      console.log(stockQuantity[0], "stockQuantity");
      for (let j = 0; j < stockQuantity.length; j++) {
        let balance, x;
        if (parseInt(stockQuantity[j].quantity) > parseInt(quantity)) {
          balance = parseInt(stockQuantity[j].quantity) - parseInt(quantity);
          x = quantity * -1;
        } else {
          balance = 0;
          x = stockQuantity[j].quantity * -1;
        }
        sql = `update stock set ? where id = ?`;
        await conn.query(sql, [{ quantity: balance }, stockQuantity[j].id]);

        sql = `insert into log set ?`;
        await conn.query(sql, {
          transaction_id,
          activity: "TRANSACTION BY USER",
          quantity: x,
          stock_id: stockQuantity[j].id,
          stock: balance,
        });
        quantity = parseInt(quantity) - parseInt(stockQuantity[j].quantity);
        if (quantity < 1) {
          break;
        }
      }
    }

    // delete cart
    for (let i = 0; i < checkoutProduct.length; i++) {
      const element = checkoutProduct[i];
      sql = `UPDATE cart SET is_deleted = 'YES' WHERE user_id = ? AND product_id = ?`;
      await conn.query(sql, [id, element.product_id]);
    }

    await conn.commit();
  } catch (error) {
    console.log(error);
    await conn.rollback();
    throw new Error(error.message || error);
  } finally {
    conn.release();
  }
};

//reject transaction //bentar dah gan

const rejectTransactionServic = async () => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    sql = `SELECT `;

    await conn.commit();
  } catch (error) {
    console.log(error);
    await conn.rollback();
    throw new Error(error.message || error);
  } finally {
    conn.release();
  }
};

//Get Prescription Transaction List
const getPrescriptionTransactionListService = async () => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();

    sql = `select * from transaction order by id desc`;
    let [prescriptionTransactionList] = await conn.query(sql);

    //Add Prescription Image
    sql = `select id, img, user_id from prescription where transaction_id = ?`;

    for (let i = 0; i < prescriptionTransactionList.length; i++) {
      const element = prescriptionTransactionList[i];
      const [prescriptionImage] = await conn.query(sql, element.id);
      console.log("ini prescriptionImage", prescriptionImage);
      prescriptionTransactionList[i] = {
        ...prescriptionTransactionList[i],
        prescription: prescriptionImage,
      };
    }

    //Add User_id Name
    sql = `select fullname, username from user where id = ?`;

    for (let i = 0; i < prescriptionTransactionList.length; i++) {
      const element = prescriptionTransactionList[i];
      const [prescriptionName] = await conn.query(sql, element.user_id);
      console.log("ini prescriptionName", prescriptionName);
      prescriptionTransactionList[i] = {
        ...prescriptionTransactionList[i],
        name: prescriptionName,
      };
    }

    await conn.commit();
    conn.release();
    return prescriptionTransactionList;
  } catch (error) {
    console.log(error);
    await conn.rollback();
    conn.release();
    throw new Error(error.message || error);
  }
};

//Accept Order
const acceptOrderService = async (transaction_id) => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    //Update status transaction
    sql = `update transaction set ? where id = ?`;
    await conn.query(sql, [{ status: 7 }, transaction_id]);

    //Update status prescription
    sql = `update prescription set ? where transaction_id = ?`;
    await conn.query(sql, [{ status: 1 }, transaction_id]);

    conn.release();
    return { message: "Order Accepted" };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Reject Order
const rejectOrderService = async (transaction_id) => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    //Update status transaction
    sql = `update transaction set ? where id = ?`;
    await conn.query(sql, [{ status: 6 }, transaction_id]);

    //Update status prescription
    sql = `update prescription set ? where transaction_id = ?`;
    await conn.query(sql, [{ status: 2 }, transaction_id]);

    conn.release();
    return { message: "Order Rejected" };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Submit Prescription Copy
const submitPrescriptionCopyService = async (data, transaction_id, user_id) => {
  let conn, sql;

  const { prescription_values } = data;

  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();

    //Cek stock availability
    for (let i = 0; i < prescription_values.length; i++) {
      const element = prescription_values[i];
      sql = `select sum(quantity) as total_quantity from stock where product_id = ?`;
      let [stockQuantity] = await conn.query(sql, element.id_obat);
      if (
        parseInt(stockQuantity[0].total_quantity) < parseInt(element.quantity)
      ) {
        console.log(element, "ini element");
        throw "There is a product in your cart gaada stokknyas "; //EDIT MESSAGE
      }
    }

    //Decrease stock
    for (let i = 0; i < prescription_values.length; i++) {
      let { id_obat, quantity } = prescription_values[i];
      sql = `select quantity, id from stock where product_id = ? and quantity > 0 order by expired_at`;
      let [stockQuantity] = await conn.query(sql, id_obat);
      for (let j = 0; j < stockQuantity.length; j++) {
        let balance, x;
        if (parseInt(stockQuantity[j].quantity) > parseInt(quantity)) {
          balance = parseInt(stockQuantity[j].quantity) - parseInt(quantity);
          x = quantity * -1;
        } else {
          balance = 0;
          x = stockQuantity[j].quantity * -1;
        }
        sql = `update stock set ? where id = ?`;
        await conn.query(sql, [{ quantity: balance }, stockQuantity[j].id]);

        sql = `insert into log set ?`;
        await conn.query(sql, {
          user_id: user_id,
          activity: "TRANSACTION BY PRESCRIPTION",
          quantity: x,
          stock_id: stockQuantity[j].id,
        });
        quantity = parseInt(quantity) - parseInt(stockQuantity[j].quantity);
        if (quantity < 1) {
          break;
        }
      }
    }

    //Update Tabel Prescription
    sql = `update prescription set ? where transaction_id = ?`;
    let updatePrescription = {
      physician_in_charge: prescription_values[0].physician_in_charge,
      patient: prescription_values[0].patient,
    };

    await conn.query(sql, [updatePrescription, transaction_id]);

    //Update Tabel Transaction
    sql = `update transaction set ? where id = ?`;
    let updateTransaction = {
      status: 2,
      expired_at: dayjs(new Date()).add(2, "day").format("YYYY-MM-DD HH:mm:ss"),
    };

    await conn.query(sql, [updateTransaction, transaction_id]);

    //Insert Into Transaction Detail Table
    //1. Add product images
    for (let i = 0; i < prescription_values.length; i++) {
      const element = prescription_values[i].id_obat;
      sql = `select image, product_id from product_image where product_id = ?`;
      let [productImage] = await conn.query(sql, element);
      console.log(productImage, "ini product image");
      prescription_values[i] = {
        ...prescription_values[i],
        image: productImage[0],
      };
    }

    //2. Add price
    for (let i = 0; i < prescription_values.length; i++) {
      const element = prescription_values[i].id_obat;
      sql = `select price, id from product where id = ?`;
      let [productPrice] = await conn.query(sql, element);
      prescription_values[i] = {
        ...prescription_values[i],
        price: productPrice,
      };
    }

    //Insert into transaction_detail with image
    for (let i = 0; i < prescription_values.length; i++) {
      const element = prescription_values[i];
      let insertTransactionDetail = {
        transaction_id: transaction_id,
        name: element.drug_name,
        quantity: element.quantity,
        price: element.price[0].price,
        image: element.image.image,
      };
      sql = `insert into transaction_detail set ?`;
      await conn.query(sql, insertTransactionDetail);
    }

    sql = `select * from transaction_detail where transaction_id = ?`;
    let [transactionDetail] = await conn.query(sql, transaction_id);

    await conn.commit();
    conn.release();
    return transactionDetail;
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
  getBankService,
  deleteCartService,
  getFeeService,
  checkoutService,
  getPrescriptionTransactionListService,
  submitPrescriptionCopyService,
  acceptOrderService,
  rejectOrderService,
};
