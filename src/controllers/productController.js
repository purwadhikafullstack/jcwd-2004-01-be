const { dbCon } = require("./../connection");
const fs = require("fs");

const inputProductController = async (req, res) => {
  let conn, sql;
  let jalur = "/image";
  const { id } = req.user;

  console.log("ini req.files", req.files);
  console.log("ini req.body", req.body);
  const {
    name, //product table
    original_price, //product table
    price, //product table
    unit, //product table
    no_bpom, //product table
    no_obat, //product table
    indication, //description table
    composition, //description table
    packaging, //description table
    med_classification, //description table
    need_receipt, //description table
    storage_method, //description table
    principal, //description table
    nomor_ijin_edar, //description table
    warning, //description table
    usage, //description table
    brand_name, //brand table
    quantity, //stock table
    expired_at, //stock table
    type_name, //type table
    symptom_name, //symptom table
  } = req.body;
  const { image } = req.files;
  console.log("image", image);

  symptomArr = JSON.parse(symptom_name);

  const imagearrpath = image
    ? image.map((val) => {
        return `${jalur}/${val.filename}`;
      })
    : [];

  console.log("ini imagearrpath", imagearrpath);

  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();
    if (!image) {
      throw { message: "Must upload at least one image!" };
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
      type_id = haveBrandName[0].id;
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

    sql = `INSERT INTO stock (product_id, quantity, expired_at) VALUES (?,?,FROM_UNIXTIME(?))`;

    let [resultStock] = await conn.query(sql, [
      product_id,
      quantity,
      expired_at,
    ]);

    //insert into symptom

    for (let i = 0; i < symptomArr.length; i++) {
      sql = `SELECT * FROM symptom WHERE name = ?`;
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
        let [resultSymptom] = await conn.query(sql, symptomArr[i]);
        let symptom_id = resultSymptom.insertId;
        sql = `INSERT INTO symptom_product (symptom_id, product_id) VALUES (?,?)`;
        let [resultSymptomProduct] = await conn.query(sql, [
          symptom_id,
          product_id,
        ]);
      }
    }

    await conn.commit();
    return res.status(200).send({ message: "input product success!" });
  } catch (error) {
    console.log(error);
    conn.rollback();
    if (imagearrpath) {
      // klo foto sudah terupload dan sql gaal maka fotonya dihapus
      for (let i = 0; i < imagearrpath.length; i++) {
        fs.unlinkSync("./public" + imagearrpath[i]);
      }
    }
    return res.status(500).send({ message: error.message || error });
  } finally {
    conn.release();
  }
};

module.exports = {
  inputProductController,
};
