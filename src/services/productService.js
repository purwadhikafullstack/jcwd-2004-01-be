const { dbCon } = require("./../connection");
const fs = require("fs");

const inputProductService = async (
  name,
  original_price,
  price,
  unit,
  no_bpom,
  no_obat,
  indication,
  composition,
  packaging,
  med_classification,
  need_receipt,
  storage_method,
  principal,
  nomor_ijin_edar,
  warning,
  usage,
  brand_name,
  quantity,
  expired_at,
  type_name,
  symptom_name,
  category_name,
  image,
  id
) => {
  let conn, sql;
  let jalur = "/image";

  console.log(image, "ini image");

  symptomArr = JSON.parse(symptom_name);
  categoryArr = JSON.parse(category_name);

  const imagearrpath = image
    ? image.map((val) => {
        return `${jalur}/${val.filename}`;
      })
    : [];

  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();
    if (!image) {
      throw "Must upload at least one image!";
    }
    if (
      !name ||
      !original_price ||
      !price ||
      !unit ||
      !no_bpom ||
      !no_obat ||
      !indication ||
      !composition ||
      !packaging ||
      !med_classification ||
      !need_receipt ||
      !storage_method ||
      !principal ||
      !nomor_ijin_edar ||
      !warning ||
      !usage ||
      !brand_name ||
      !quantity ||
      !expired_at ||
      !type_name ||
      !symptom_name ||
      !category_name
    ) {
      throw "Please check your submisson";
    }

    //insert data to description table
    sql = `INSERT INTO description set ?`;

    let dataDescription = {
      indication,
      composition,
      packaging,
      med_classification,
      need_receipt,
      storage_method,
      principal,
      nomor_ijin_edar,
      warning,
      usage,
    };

    let [resutlDescription] = await conn.query(sql, dataDescription);

    let description_id = resutlDescription.insertId;

    // insert Into brand table

    sql = `select id, name FROM brand WHERE name = ?`;
    let [haveBrandName] = await conn.query(sql, brand_name);
    let brand_id;
    if (!haveBrandName.length) {
      sql = `INSERT INTO brand set ?`;

      let dataBrand = {
        name: brand_name,
      };

      let [resultBrand] = await conn.query(sql, dataBrand);

      brand_id = resultBrand.insertId;
    } else {
      brand_id = haveBrandName[0].id;
    }

    console.log(brand_id, "brand_id");
    // insert Into type table

    sql = `select id, name FROM type WHERE name = ?`;
    let [haveTypeName] = await conn.query(sql, type_name);
    let type_id;

    if (!haveTypeName.length) {
      sql = `INSERT INTO type set ?`;

      let dataBrand = {
        name: type_name,
      };

      let [resultType] = await conn.query(sql, dataBrand);

      type_id = resultType.insertId;
    } else {
      type_id = haveTypeName[0].id;
    }

    // insert into product table
    sql = `INSERT INTO product SET ?`;
    let dataTable = {
      name: name,
      description_id,
      brand_id,
      type_id,
      user_id: id,
      original_price,
      price,
      unit,
      no_bpom,
      no_obat,
    };
    let [resultProdcut] = await conn.query(sql, dataTable);
    console.log(resultProdcut.insertId);

    let product_id = resultProdcut.insertId;

    // insert into  posts_images
    sql = `INSERT INTO product_image set ?`;

    for (let i = 0; i < imagearrpath.length; i++) {
      let insertDataImage = {
        image: imagearrpath[i],
        product_id,
      };
      await conn.query(sql, insertDataImage);
    }

    // insert into stock

    // sql = `SELECT id FROM stock WHERE product_id = ? AND expired_at = FROM_UNIXTIME(?)`;

    // let [haveStockExp] = await conn.query(sql, [product_id, expired_at]);

    // if (haveStockExp.length) {
    //   sql = `UPDATE stock SET quantity = quantity + ?
    //   WHERE id = ?`;

    //   let resultStock = await conn.query(sql, [quantity, haveStockExp[0].id]);
    // } else {
    sql = `INSERT INTO stock (product_id, quantity, expired_at) VALUES (?,?,FROM_UNIXTIME(?))`;
    let [resultStock] = await conn.query(sql, [
      product_id,
      quantity,
      expired_at,
    ]);
    // }

    //insert into symptom

    for (let i = 0; i < symptomArr.length; i++) {
      sql = `SELECT id FROM symptom WHERE name = ?`;
      let [haveSymptom] = await conn.query(sql, symptomArr[i]);
      if (haveSymptom.length) {
        let symptom_id = haveSymptom[0].id;
        sql = `INSERT INTO symptom_product (symptom_id, product_id) VALUES (?,?)`;
        let [resultSymptomProduct] = await conn.query(sql, [
          symptom_id,
          product_id,
        ]);
      } else {
        sql = `INSERT INTO symptom (name) VALUES (?)`;
        let [resultSymptomp] = await conn.query(sql, symptomArr[i]);
        let symptom_id = resultSymptomp.insertId;
        sql = `INSERT INTO symptom_product (symptom_id, product_id) VALUES (?,?)`;
        let [resultSymptompProduct] = await conn.query(sql, [
          symptom_id,
          product_id,
        ]);
      }
    }

    // insert into category

    for (let i = 0; i < categoryArr.length; i++) {
      sql = `SELECT id FROM category WHERE name = ?`;
      let [haveCategory] = await conn.query(sql, categoryArr[i]);
      if (haveCategory.length) {
        let category_id = haveCategory[0].id;
        sql = `INSERT INTO category_product (category_id, product_id) VALUES (?,?)`;
        let [resultCategoryProduct] = await conn.query(sql, [
          category_id,
          product_id,
        ]);
      } else {
        sql = `INSERT INTO category (name) VALUES (?)`;
        let [resultCategory] = await conn.query(sql, categoryArr[i]);
        let category_id = resultCategory.insertId;
        sql = `INSERT INTO category_product (category_id, product_id) VALUES (?,?)`;
        let [resultCategoryProduct] = await conn.query(sql, [
          category_id,
          product_id,
        ]);
      }
    }

    await conn.commit();
    return { message: "Email successfully sent" };
  } catch (error) {
    console.log(error);
    conn.rollback();
    if (imagearrpath) {
      // klo foto sudah terupload dan sql gaal maka fotonya dihapus
      for (let i = 0; i < imagearrpath.length; i++) {
        fs.unlinkSync("./public" + imagearrpath[i]);
      }
    }
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const getCategoryService = async (req, res) => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    sql = `SELECT name FROM category`;
    let [result] = await conn.query(sql);

    conn.commit();
    return result;
  } catch (error) {
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const getSymptomService = async () => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    sql = `SELECT name FROM symptom`;
    let [result] = await conn.query(sql);

    conn.commit();
    return result;
  } catch (error) {
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const getTypeService = async (r) => {
  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    sql = `SELECT name FROM type`;
    let [result] = await conn.query(sql);

    conn.commit();
    return result;
  } catch (error) {
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

module.exports = {
  inputProductService,
  getCategoryService,
  getSymptomService,
  getTypeService,
};
