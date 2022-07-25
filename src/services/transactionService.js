const { dbCon } = require("./../connection");
const { default: axios } = require("axios");
const { uuidCode, codeGenerator } = require("../helpers/UUID");
const fs = require("fs");
const dayjs = require("dayjs");
const schedule = require("node-schedule");

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
    await conn.rollback();
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
    // await conn.beginTransaction();

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

    sql = `SELECT name, unit, price, original_price FROM product WHERE product.id = ?`;
    for (let i = 0; i < data.length; i++) {
      let [resultProdcut] = await conn.query(sql, data[i].product_id);
      data[i] = { ...data[i], detail_product: resultProdcut[0] };
    }

    console.log(data);

    // await conn.commit();
    return data;
  } catch (error) {
    console.log(error);
    // await conn.rollback();
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

    await conn.commit();
    return quantityProduct[0];
  } catch (error) {
    console.log(error);
    await conn.rollback();
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

    //Add City Name
    for (let i = 0; i < userAddress.length; i++) {
      const element = userAddress[i];
      sql = `select name from city where id = ?`;
      let [cityName] = await conn.query(sql, element.city_id);
      userAddress[i] = {
        ...userAddress[i],
        city: cityName,
      };
    }

    //Add Province Name
    for (let i = 0; i < userAddress.length; i++) {
      const element = userAddress[i];
      sql = `select name from province where id = ?`;
      let [provinceName] = await conn.query(sql, element.province_id);
      userAddress[i] = {
        ...userAddress[i],
        province: provinceName,
      };
    }

    //Insert to transaction table
    let insertData = {
      user_id: id,
      address: `${userAddress[0].address}, Kota ${userAddress[0].city[0].name}, ${userAddress[0].province[0].name}`,
      status: 1,
      phone_number: userAddress[0].recipient_number,
      recipient: userAddress[0].recipient_name,
      transaction_code: codeGenerator("TRA", id),
      expired_at: dayjs(new Date()).add(2, "day").format("YYYY-MM-DD HH:mm:ss"),
      is_prescription: 1,
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
    // await conn.beginTransaction();

    //get bank
    sql = `SELECT id, name, image FROM bank`;
    let [resultBank] = await conn.query(sql);

    // await conn.commit();
    return resultBank;
  } catch (error) {
    console.log(error);
    // await conn.rollback();
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
    // await conn.beginTransaction();

    //update is Deleted
    sql = `UPDATE cart SET is_deleted = "YES" WHERE id = ?`;
    await conn.query(sql, id);

    // await conn.commit();
  } catch (error) {
    console.log(error);
    // await conn.rollback();
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

    //Input Into Tabel Transaction
    sql = `INSERT INTO transaction SET ?`;
    let updateTransaction = {
      bank_id: data.bank_id,
      status: 2,
      user_id: id,
      address: data.address,
      phone_number: data.phone_number,
      recipient: data.recipient,
      delivery_fee: data.delivery_fee,
      total_price: data.total_price,
      transaction_code: codeGenerator("TRA", data.phone_number),
      expired_at: dayjs(new Date()).add(1, "day").format("YYYY-MM-DD HH:mm:ss"),
      is_prescription: 2,
    };
    let [resultTransaction] = await conn.query(sql, updateTransaction);

    let transaction_id = resultTransaction.insertId;

    // kurangin stock
    for (let i = 0; i < checkoutProduct.length; i++) {
      sql = `INSERT INTO transaction_detail SET ?`;
      let { product_id, detail_product, quantity, image } = checkoutProduct[i];
      let dataTransactionDetail = {
        transaction_id,
        name: detail_product.name,
        quantity,
        price: detail_product.price,
        image,
        original_price: detail_product.original_price,
      };
      await conn.query(sql, dataTransactionDetail);

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
const getPrescriptionTransactionListService = async (
  search,
  transaction_date_from,
  transaction_date_end,
  menunggu,
  diproses,
  dikirim,
  selesai,
  dibatalkan,
  page,
  limit,
  orderDate,
  orderPrice
) => {
  //Page

  if (!limit) {
    limit = 5;
  } else {
    limit = parseInt(limit);
  }

  if (!page) {
    page = 0;
  } else {
    page = parseInt(page);
  }

  let offset = page * limit;

  //Filter
  if (!search) {
    search = ``;
  } else {
    search = `AND transaction.transaction_code LIKE '%${search}%' or user.fullname LIKE '%${search}%' or user.username LIKE '%${search}%'`;
    console.log(search);
  }

  let transaction_date;
  if (!transaction_date_from) {
    transaction_date = ``;
  } else {
    transaction_date = `AND transaction.created_at between '${transaction_date_from}' AND '${transaction_date_end}'`;
  }

  let order;
  if (!orderDate && !orderPrice) {
    order = `ORDER BY transaction.created_at desc`;
  } else if (orderDate && !orderPrice) {
    order = `ORDER BY transaction.created_at ${orderDate}`;
  } else if (!orderDate && orderPrice) {
    order = `ORDER BY transaction.total_price ${orderPrice}`;
  } else if (orderDate && orderPrice) {
    order = `ORDER BY transaction.created_at ${orderDate}, transaction.total_price ${orderPrice}`;
  }

  if (!menunggu) {
    menunggu = ``;
  } else {
    menunggu = `AND status in ('MENUNGGU_KONFIRMASI', 'MENUNGGU_PEMBAYARAN', 'MENUNGGU_KONFIRMASI_PEMBAYARAN')`;
  }

  if (!diproses) {
    diproses = ``;
  } else {
    diproses = `AND status = 'DIPROSES'`;
  }

  if (!dikirim) {
    dikirim = ``;
  } else {
    dikirim = `AND status = 'DIKIRIM'`;
  }

  if (!selesai) {
    selesai = ``;
  } else {
    selesai = `AND status = 'SELESAI'`;
  }

  if (!dibatalkan) {
    dibatalkan = ``;
  } else {
    dibatalkan = `AND status = 'DITOLAK'`;
  }

  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    // await conn.beginTransaction();

    sql = `select  transaction.id, transaction.user_id, transaction.status, transaction.address, transaction.phone_number, transaction.created_at, transaction.updated_at, transaction.payment_slip, transaction.transaction_code, transaction.bank_id, transaction.delivery_fee, transaction.total_price, transaction.expired_at, user.username, user.fullname from transaction join user on user.id=transaction.user_id where true ${menunggu} ${diproses} ${dikirim} ${selesai} ${dibatalkan} ${transaction_date} ${search} ${order} LIMIT ${dbCon.escape(
      offset
    )}, ${dbCon.escape(limit)}`;

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

    //Add Transaction Detail
    sql = `select id, name, quantity, price, image, dosage from transaction_detail where transaction_id = ?`;
    for (let i = 0; i < prescriptionTransactionList.length; i++) {
      const element = prescriptionTransactionList[i];
      const [orderedProduct] = await conn.query(sql, element.id);
      console.log("ini ordered product", orderedProduct);
      prescriptionTransactionList[i] = {
        ...prescriptionTransactionList[i],
        orderedProduct: orderedProduct,
      };
    }

    //x-total-product
    sql = `select count(*) as total_data from (select  transaction.id, transaction.user_id, transaction.status, transaction.address, transaction.phone_number, transaction.created_at, transaction.updated_at, transaction.payment_slip, transaction.transaction_code, transaction.bank_id, transaction.delivery_fee, transaction.total_price, transaction.expired_at, user.username, user.fullname from transaction join user on user.id=transaction.user_id where true ${menunggu} ${diproses} ${dikirim} ${selesai} ${dibatalkan} ${search} ${transaction_date}) as data_table`;

    let [totalData] = await conn.query(sql);

    //Add User_id Name
    // sql = `select fullname, username from user where id = ?`;

    // for (let i = 0; i < prescriptionTransactionList.length; i++) {
    //   const element = prescriptionTransactionList[i];
    //   const [prescriptionName] = await conn.query(sql, element.user_id);
    //   console.log("ini prescriptionName", prescriptionName);
    //   prescriptionTransactionList[i] = {
    //     ...prescriptionTransactionList[i],
    //     name: prescriptionName,
    //   };
    // }

    // await conn.commit();
    conn.release();
    return { prescriptionTransactionList, totalData };
  } catch (error) {
    console.log(error);
    // await conn.rollback();
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
    await conn.query(sql, [{ status: 3 }, transaction_id]);

    //Update prescription status if exist
    sql = `select status from prescription where transaction_id = ?`;
    let [prescriptionExist] = await conn.query(sql, transaction_id);

    if (prescriptionExist.length > 0) {
      for (let i = 0; i < prescriptionExist.length; i++) {
        sql = `update prescription set ? where transaction_id = ?`;
        await conn.query(sql, [{ status: 1 }, transaction_id]);
      }
    }

    conn.release();
    return { message: "Order Accepted" };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Send Order Service
const sendOrderService = async (transaction_id) => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    // Update Transaction status
    sql = `update transaction set ? where id = ?`;
    await conn.query(sql, [{ status: 4 }, transaction_id]);

    conn.release();
    return { message: "Order sent" };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Accept Order User
const acceptOrderUserService = async (transaction_id) => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    // Update Transaction status
    sql = `update transaction set ? where id = ?`;
    await conn.query(sql, [{ status: 5 }, transaction_id]);

    conn.release();
    return { message: "Order accepted" };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Reject PRESCRIPTION
const rejectPrescriptionService = async (transaction_id) => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();
    //Update status transaction
    sql = `update transaction set ? where id = ?`;
    await conn.query(sql, [{ status: 6 }, transaction_id]);

    //Update status prescription
    sql = `update prescription set ? where transaction_id = ?`;
    await conn.query(sql, [{ status: 2 }, transaction_id]);

    await conn.commit();
    conn.release();
    return { message: "Prescription Rejected" };
  } catch (error) {
    console.log(error);
    await conn.rollback();
    conn.release();
    throw new Error(error.message || error);
  }
};

//Reject Transaction (RESTORE STOCK)
const rejectOrderService = async (transaction_id, id) => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();

    //Select specific stock
    sql = `select id, stock_id, quantity from log where transaction_id = ?`;
    let [selectedStock] = await conn.query(sql, transaction_id);

    //Update transaction status
    sql = `update transaction set ? where id = ?`;
    await conn.query(sql, [{ status: 6 }, transaction_id]);

    //Update prescription status if exist
    sql = `select * from prescription where transaction_id = ?`;
    let [prescriptionExist] = await conn.query(sql, transaction_id);

    if (prescriptionExist.length > 0) {
      for (let i = 0; i < prescriptionExist.length; i++) {
        sql = `update prescription set ? where transaction_id = ?`;
        await conn.query(sql, [{ status: 2 }, transaction_id]);
      }
    }

    //Cycle through the array and restore the balance of the universe
    for (let i = 0; i < selectedStock.length; i++) {
      let element = selectedStock[i];
      sql = `select id, quantity from stock where id = ?`;
      let [restoredStock] = await conn.query(sql, element.stock_id);
      let restoredValue =
        Math.abs(parseInt(element.quantity)) +
        parseInt(restoredStock[0].quantity);

      let updateQuantityStock = {
        quantity: restoredValue,
      };
      sql = `update stock set ? where id = ?`;
      await conn.query(sql, [updateQuantityStock, restoredStock[0].id]);

      let insertDataLog = {
        activity: "REJECTED ORDER",
        quantity: `+${Math.abs(parseInt(element.quantity))}`,
        stock_id: element.stock_id,
        transaction_id: transaction_id,
        user_id: id,
        stock: restoredValue,
      };
      sql = `insert into log set ?`;
      await conn.query(sql, insertDataLog);
    }

    await conn.commit();
    conn.release();
    return { message: "Transaction successfully rejected" };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw new Error(error.message || error);
  }
};

//Submit Prescription Copy
const submitPrescriptionCopyService = async (data, transaction_id, id) => {
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
        throw "A product stok is depleted"; //EDIT MESSAGE
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
          user_id: id,
          activity: "TRANSACTION BY PRESCRIPTION",
          quantity: x,
          stock_id: stockQuantity[j].id,
          transaction_id: transaction_id,
          stock: balance,
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
      status: 1,
    };

    await conn.query(sql, [updatePrescription, transaction_id]);

    //Update Tabel Transaction
    sql = `select user_id from transaction where id = ?`;
    let [userID] = await conn.query(sql, transaction_id);

    sql = `select city_id from address where is_default = 'YES' and user_id = ?`;
    let [cityID] = await conn.query(sql, userID[0].user_id);

    let ongkir = await getFeeService(cityID[0].city_id);

    sql = `update transaction set ? where id = ?`;
    let updateTransaction = {
      status: 2,
      expired_at: dayjs(new Date()).add(2, "day").format("YYYY-MM-DD HH:mm:ss"),
      delivery_fee: ongkir,
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
        dosage: element.dosage,
        original_price: element.original_price,
      };
      sql = `insert into transaction_detail set ?`;
      await conn.query(sql, insertTransactionDetail);
    }

    //Sum Price and insert into transaction
    // sql = `select price, quantity from transaction_detail where transaction_id = ?`;
    // let [priceQuantity] = await conn.query(sql, transaction_id);

    //Insert total_price into transaction
    let multiplication = 0;
    for (let i = 0; i < prescription_values.length; i++) {
      const element = prescription_values[i];
      multiplication +=
        parseInt(element.quantity) * parseInt(element.price[0].price);
    }
    console.log(multiplication, "ini sum mul");

    sql = `update transaction set ? where id = ?`;
    await conn.query(sql, [{ total_price: multiplication }, transaction_id]);

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

//Get Transaction Detail Products (CARD TRANSACTION)
const getTransactionDetailProductsService = async (transaction_id) => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `select id, name, quantity, price, image, dosage from transaction_detail where transaction_id = ?`;
    let [products] = await conn.query(sql, transaction_id);

    conn.release();
    return products;
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Get Transaction List USER
const getTransactionListUserService = async (
  page,
  limit,
  menunggu,
  diproses,
  dikirim,
  selesai,
  dibatalkan,
  // semua,
  prescription,
  non_prescription,
  obatResep,
  obatBebas,
  orderByDate,
  id
) => {
  console.log(
    page,
    limit,
    menunggu,
    diproses,
    dikirim,
    selesai,
    dibatalkan,
    orderByDate,
    id,
    obatResep,
    obatBebas,
    "cie gitu"
  );
  if (!menunggu) {
    menunggu = ``;
  } else {
    menunggu = `AND status in ('MENUNGGU_KONFIRMASI', 'MENUNGGU_PEMBAYARAN', 'MENUNGGU_KONFIRMASI_PEMBAYARAN')`;
  }

  if (!diproses) {
    diproses = ``;
  } else {
    diproses = `AND status = 'DIPROSES'`;
  }

  if (!dikirim) {
    dikirim = ``;
  } else {
    dikirim = `AND status = 'DIKIRIM'`;
  }

  if (!selesai) {
    selesai = ``;
  } else {
    selesai = `AND status = 'SELESAI'`;
  }

  if (!dibatalkan) {
    dibatalkan = ``;
  } else {
    dibatalkan = `AND status = 'DITOLAK'`;
  }

  if (!obatResep) {
    obatResep = ``;
  } else {
    obatResep = `AND is_prescription = 'YES'`;
  }

  if (!obatBebas) {
    obatBebas = ``;
  } else {
    obatBebas = `AND is_prescription = 'NO'`;
  }

  let order;
  if (!orderByDate) {
    order = `ORDER BY transaction.created_at desc`;
  } else {
    order = `ORDER BY transaction.created_at asc`;
  }

  if (!prescription) {
    prescription = ``;
  } else {
    prescription = `AND is_prescription = 'YES'`;
  }

  if (!non_prescription) {
    non_prescription = ``;
  } else {
    non_prescription = `AND is_prescription = 'NO'`;
  }

  // if (semua) {
  //   prescription = ``;
  //   non_prescription = ``;
  // }

  if (!limit) {
    limit = 5;
  } else {
    limit = parseInt(limit);
  }

  if (!page) {
    page = 0;
  } else {
    page = parseInt(page);
  }

  let offset = page * limit;
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    // await conn.beginTransaction();

    sql = `select  transaction.id, transaction.user_id, transaction.status, transaction.address, transaction.phone_number, transaction.created_at, transaction.updated_at, transaction.payment_slip, transaction.is_prescription, transaction.updated_at, transaction.transaction_code, transaction.bank_id, transaction.delivery_fee, transaction.total_price, transaction.expired_at, user.username, user.fullname from transaction join user on user.id=transaction.user_id where true and user.id = ? ${menunggu} ${diproses} ${dikirim} ${selesai} ${dibatalkan} ${prescription} ${non_prescription} ${obatResep} ${obatBebas} ${order} LIMIT ${dbCon.escape(
      offset
    )}, ${dbCon.escape(limit)}`;

    let [prescriptionTransactionList] = await conn.query(sql, id);

    //Add Prescription Image
    sql = `select id, img, user_id, prescription_code from prescription where transaction_id = ?`;

    for (let i = 0; i < prescriptionTransactionList.length; i++) {
      const element = prescriptionTransactionList[i];
      const [prescriptionImage] = await conn.query(sql, element.id);
      // console.log("ini prescriptionImage", prescriptionImage);
      prescriptionTransactionList[i] = {
        ...prescriptionTransactionList[i],
        prescription: prescriptionImage,
      };
    }

    //Add Transaction Detail
    sql = `select id, name, quantity, price, image, dosage from transaction_detail where transaction_id = ?`;
    for (let i = 0; i < prescriptionTransactionList.length; i++) {
      const element = prescriptionTransactionList[i];
      const [orderedProduct] = await conn.query(sql, element.id);
      // console.log("ini ordered product", orderedProduct);
      prescriptionTransactionList[i] = {
        ...prescriptionTransactionList[i],
        orderedProduct: orderedProduct,
      };
    }

    //x-total-product

    sql = `select count(*) as total_data from (select  transaction.id, transaction.user_id, transaction.status, transaction.address, transaction.phone_number, transaction.created_at, transaction.is_prescription, transaction.updated_at, transaction.payment_slip, transaction.transaction_code, transaction.bank_id, transaction.delivery_fee, transaction.total_price, transaction.expired_at, user.username, user.fullname from transaction join user on user.id=transaction.user_id where true ${menunggu} ${diproses} ${dikirim} ${selesai} ${dibatalkan} ${prescription} ${non_prescription} ${obatResep} ${obatBebas}) as data_table`;

    let [totalData] = await conn.query(sql);

    // await conn.commit();
    conn.release();
    return { prescriptionTransactionList, totalData };
  } catch (error) {
    console.log(error);
    // await conn.rollback();
    conn.release();
    throw new Error(error.message || error);
  }
};

//Upload Bukti Pembayaran
const uploadSlipPaymentService = async (payment_slip, transaction_id) => {
  let path = "/paymentslip";
  const imagePath = payment_slip ? `${path}/${payment_slip.filename}` : null;
  console.log(payment_slip, "ini payment_slip");

  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `update transaction set ? where id = ?`;
    let updateData = {
      payment_slip: imagePath,
      status: 8,
    };
    await conn.query(sql, [updateData, transaction_id]);

    sql = `select payment_slip from transaction where id = ?`;
    let [result] = await conn.query(sql, transaction_id);
    console.log(result, "ini payment_slip uploaded");

    conn.release();
    return { data: result[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Test Node-Schedule
// const testNodeSchedule = async () => {
//   let conn, sql;
//   try {
//     conn = await dbCon.promise().getConnection();

//     sql = `select * from transaction where expired_at <= current_timestamp() and status != 'DITOLAK'`;
//     let [transactionData] = await conn.query(sql);

//     if (transactionData.length > 0) {
//       for (let i = 0; i < transactionData.length; i++) {
//         const element = transactionData[i];
//         sql = `update transaction set ? where id = ?`;
//         await conn.query(sql, [{ status: 6 }, element.id]);
//         console.log(`Ke update bos yang ini -${element.id}`);
//       }
//     }

//     console.log("gaada yg diupdate bos");
//     conn.release();
//     return { message: "Updated" };
//   } catch (error) {
//     console.log(error);
//     conn.release();
//     throw new Error(error.message || error);
//   }
// };

// schedule.scheduleJob("* * * * *", () => {
//   testNodeSchedule();
// });

//Reject Transaction (RESTORE STOCK) / AUTOMATED
const rejectOrderServiceCRON = async () => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();

    //Select expired transaction
    sql = `select * from transaction where expired_at <= current_timestamp() and status not in ('DITOLAK', 'DIPROSES', 'DIKIRIM', 'SELESAI')`;
    let [transactionData] = await conn.query(sql);

    if (transactionData.length > 0) {
      for (let i = 0; i < transactionData.length; i++) {
        const element = transactionData[i];

        //Select specific stock from log
        sql = `select id, stock_id, quantity from log where transaction_id = ?`;
        let [selectedStock] = await conn.query(sql, element.id);

        //Cycle through the array and restore the balance of the universe
        for (let j = 0; j < selectedStock.length; j++) {
          sql = `select id, quantity from stock where id = ?`;
          let [restoredStock] = await conn.query(
            sql,
            selectedStock[j].stock_id
          );
          let restoredValue =
            Math.abs(parseInt(selectedStock[j].quantity)) +
            parseInt(restoredStock[0].quantity);

          let updateQuantityStock = {
            quantity: restoredValue,
          };
          sql = `update stock set ? where id = ?`;
          await conn.query(sql, [
            updateQuantityStock,
            selectedStock[j].stock_id,
          ]);

          let insertDataLog = {
            activity: "REJECTED ORDER BY SYSTEM",
            quantity: `+${Math.abs(parseInt(selectedStock[j].quantity))}`,
            stock_id: selectedStock[j].stock_id,
            transaction_id: element.id,
            stock: restoredValue,
          };
          sql = `insert into log set ?`;
          await conn.query(sql, insertDataLog);
        }

        sql = `update transaction set ? where id = ?`;
        await conn.query(sql, [{ status: 6 }, element.id]);
        console.log(`Ke update bos yang ini -${element.id}`);

        //Update prescription status if exist
        sql = `select * from prescription where transaction_id = ?`;
        let [prescriptionExist] = await conn.query(sql, element.id);

        if (prescriptionExist.length > 0) {
          for (let k = 0; k < prescriptionExist.length; k++) {
            sql = `update prescription set ? where transaction_id = ?`;
            await conn.query(sql, [{ status: 2 }, element.id]);
            console.log(`resep ke-${prescriptionExist[k].id} ke update jg bos`);
          }
        }
      }
    }

    await conn.commit();
    conn.release();
    return { message: "Transaction successfully rejected by system" };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw new Error(error.message || error);
  }
};

schedule.scheduleJob("*/5 * * * *", () => {
  rejectOrderServiceCRON();
});

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
  rejectPrescriptionService,
  getTransactionDetailProductsService,
  getTransactionListUserService,
  uploadSlipPaymentService,
  rejectOrderService,
  sendOrderService,
  acceptOrderUserService,
};
