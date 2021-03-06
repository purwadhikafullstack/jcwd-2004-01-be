const { dbCon } = require("./../connection");
const fs = require("fs");
const dayjs = require("dayjs");
const schedule = require("node-schedule");

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

    let stock_id = resultStock.insertId;
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

    // input log
    sql = `INSERT INTO log SET ?`;
    dataLog = {
      activity: "UPDATE STOCK",
      quantity: quantity,
      stock_id: stock_id,
      stock: quantity,
      user_id: id,
    };
    await conn.query(sql, dataLog);

    await conn.commit();
    return { message: "Product Input Success" };
  } catch (error) {
    console.log(error);
    await conn.rollback();
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

    return result;
  } catch (error) {
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const deleteProductService = async (data) => {
  const { id } = data;

  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    sql = `SELECT id FROM product where id = ?`;
    let [haveProduct] = await conn.query(sql, id);

    if (!haveProduct.length) {
      throw "Product not found!";
    }

    sql = `SELECT * FROM product where id = ? AND is_deleted = "?"`;
    let [alreadyDeletedProduct] = await conn.query(sql, [id, "YES"]);

    console.log(alreadyDeletedProduct[0]);

    if (alreadyDeletedProduct.length) {
      throw "Product already deleted!";
    }

    sql = `UPDATE product SET is_deleted = ? WHERE id = ?`;
    let [result] = await conn.query(sql, ["YES", id]);

    return { data: result };
  } catch (error) {
    console.log(error);
    throw new Error(error.message || error);
  } finally {
    conn.release();
  }
};

const getAllProductService = async (
  search,
  page,
  limit,
  category,
  orderName,
  orderPrice
) => {
  let conn, sql;

  console.log(
    search,
    page,
    limit,
    category,
    orderName,
    orderPrice,
    "di service"
  );

  if (!category) {
    category = ``;
  } else {
    category = `and category_name = "${category}"`;
  }

  if (!page) {
    page = 0;
  }

  if (!limit) {
    limit = 10;
  }

  if (!search) {
    search = ``;
  } else {
    search = `AND product.name LIKE '%${search}%'`;
  }

  if (!orderName && !orderPrice) {
    order = ``;
  } else if (orderName && !orderPrice) {
    order = `ORDER BY product.name ${orderName}`;
  } else if (!orderName && orderPrice) {
    order = `ORDER BY product.price ${orderPrice}`;
  } else if (orderName && orderPrice) {
    order = `ORDER BY product.name ${orderName}, product.price ${orderPrice}`;
  }

  if (!orderPrice) {
    orderPrice = ``;
  } else {
    orderPrice = `ORDER BY poduct.price ${orderPrice}`;
  }

  limit = parseInt(limit);

  let offset = page * limit;

  console.log(order);

  try {
    conn = await dbCon.promise().getConnection();

    // await conn.beginTransaction();

    //get product for admin dashboard
    sql = `select product.id, name, original_price, price, unit, no_obat, no_bpom,
    (select sum(quantity) from stock where product_id = product.id) as total_stock from product
    inner join category_product on product.id = category_product.product_id
    left join (select name as category_name, id from category) as kategori on category_id = kategori.id where true ${category} ${search} AND product.is_deleted = "NO"
    group by product.id ${order} LIMIT ${dbCon.escape(offset)}, ${dbCon.escape(
      limit
    )}`;

    let [data] = await conn.query(sql);

    //put category on data
    sql = `select id, name from category_product cp inner join category c on cp.category_id = c.id where product_id = ?`;

    for (let i = 0; i < data.length; i++) {
      let element = data[i];
      let [categories] = await conn.query(sql, element.id);
      data[i] = { ...data[i], num: page * limit + (i + 1) };
      data[i].categories = categories;
    }

    sql = `select count(*) as total_data from (select product.id, name, original_price, price, unit, no_obat, no_bpom,
      (select sum(quantity) from stock where product_id = product.id) as total_stock from product
      inner join category_product on product.id = category_product.product_id
      left join (select name as category_name, id from category) as kategori on category_id = kategori.id where true ${category} ${search} AND product.is_deleted = "NO"
      group by product.id) as table_data`;

    let [totalData] = await conn.query(sql);

    // res.set("x-total-product", totalData[0].total_data);

    // await conn.commit();
    return { data, totalData };
  } catch (error) {
    // await conn.rollback();
    throw new Error(error.message || error);
  } finally {
    conn.release();
  }
};

const getProductService = async (id) => {
  let conn, sql;

  console.log(id, "di service");

  try {
    conn = await dbCon.promise().getConnection();

    // await conn.beginTransaction();

    //get product for admin dashboard
    sql = `select indication, composition, packaging,med_classification,need_receipt, storage_method, principal, nomor_ijin_edar, warning, description.usage, product.id, product.name, brand.name as brand, original_price, price, unit, no_obat, no_bpom, type.name as type_name,
    (select sum(quantity) from stock where product_id = product.id) as total_stock from product
    inner join category_product on product.id = category_product.product_id
    left join (select name as category_name, id from category) as kategori on category_id = kategori.id
    left join description on description_id = description.id
    left join brand on brand_id = brand.id
    left join type on type_id = type.id
    where product.id = ?`;

    let [data] = await conn.query(sql, id);

    console.log(data, "ini data");

    //put category on data
    sql = `select id, name from category_product cp inner join category c on cp.category_id = c.id where product_id = ?`;

    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      let [categories] = await conn.query(sql, element.id);
      data[i].categories = categories;
    }
    console.log(data[0], "ini data 0");

    //put symptomps on data

    sql = `select id, name from symptom_product sp inner join symptom s on sp.symptom_id = s.id where product_id = ?`;

    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      let [symptom] = await conn.query(sql, element.id);
      data[i].symptom = symptom;
    }

    //put image on data

    sql = `select image from product_image where product_id = ?`;

    const [resultImage] = await conn.query(sql, data[0].id);

    data[0] = { ...data[0], imageProduct: resultImage };

    console.log(data[0]);

    // await conn.commit();
    return data[0];
  } catch (error) {
    // await conn.rollback();
    throw new Error(error.message || error);
  } finally {
    conn.release();
  }
};

const getCategoryListService = async () => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    //Get Category
    sql = `select id, name from category`;
    let [category] = await conn.query(sql);

    //Get Symptom
    sql = `select id, name from symptom`;
    let [symptom] = await conn.query(sql);

    //Get Type
    sql = `select id, name from type`;
    let [type] = await conn.query(sql);

    //Get Brand
    sql = `select id, name from brand`;
    let [brand] = await conn.query(sql);

    //Put everything in an object
    let userData = {};
    userData = { ...userData, category, symptom, type, brand };

    conn.release();
    return userData;
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

const getHomeProductService = async (
  search,
  page,
  limit,
  category,
  orderName,
  orderPrice,
  symptom,
  type,
  brand,
  minPrice,
  maxPrice
) => {
  let conn, sql;

  console.log(
    search,
    page,
    limit,
    category,
    orderName,
    orderPrice,
    "di service"
  );

  if (!category) {
    category = ``;
  } else {
    category = `and category_name = "${category}"`;
  }

  if (symptom) {
    // symptom = symptom.split(",").map((val) => parseInt(val));
    symptom = `where symptom_id in (${dbCon.escape(symptom)})`;
  } else {
    symptom = ``;
  }

  if (type) {
    type = `and type_id in (${type})`;
  } else {
    type = ``;
  }

  if (brand) {
    brand = `and brand_id in (${brand})`;
  } else {
    brand = ``;
  }

  if (!page) {
    page = 0;
  }

  if (!limit) {
    limit = 12;
  }

  if (!search) {
    search = ``;
  } else {
    search = `AND product.name LIKE '%${search}%'`;
  }

  if (!orderName && !orderPrice) {
    order = ``;
  } else if (orderName && !orderPrice) {
    order = `ORDER BY product.name ${orderName}`;
  } else if (!orderName && orderPrice) {
    order = `ORDER BY product.price ${orderPrice}`;
  }

  let priceRange;
  if (!minPrice && !maxPrice) {
    priceRange = ``;
  } else if (minPrice && !maxPrice) {
    priceRange = `AND product.price >= '${minPrice}'`;
  } else if (!minPrice && maxPrice) {
    priceRange = `AND product.price <= '${maxPrice}'`;
  } else if (minPrice && maxPrice) {
    priceRange = `AND product.price between '${minPrice}' and '${maxPrice}'`;
  }
  // else if (orderName && orderPrice) {
  //   order = `ORDER BY product.name ${orderName}, product.price ${orderPrice}`;
  // }

  // if (!orderName) {
  //   orderName = ``;
  // } else {
  //   orderName = `ORDER BY product.name ${orderName}`;
  // }

  // if(!orderPrice){}

  // if (!orderPrice) {
  //   orderPrice = ``;
  // } else {
  //   orderPrice = `ORDER BY poduct.price ${orderPrice}`;
  // }

  limit = parseInt(limit);

  let offset = page * limit;

  console.log(category, type, brand, "ini yg undefined");

  try {
    conn = await dbCon.promise().getConnection();

    // await conn.beginTransaction();
    //get product for admin dashboard
    sql = `select product.id, name, price, unit, type_name, brand_name, category_name, symptom_name,
    (select sum(quantity) from stock where product_id = product.id) as total_stock from product
    inner join category_product on product.id = category_product.product_id
    inner join (select name as type_name, id from type) as type on product.type_id = type.id
    inner join (select name as brand_name,id from brand) as brand on product.brand_id = brand.id
    inner join (select symptom_id,product_id from symptom_product ${symptom}) as symptom_product on product.id = symptom_product.product_id
    left join (select name as symptom_name, id from symptom) as symptom on symptom_id = symptom.id
    left join (select name as category_name, id from category) as kategori on category_id = kategori.id where true ${search} ${category} ${type} ${brand} ${priceRange} AND product.is_deleted = "NO"
    group by product.id ${order} LIMIT ${dbCon.escape(offset)}, ${dbCon.escape(
      limit
    )}`;

    let [data] = await conn.query(sql);
    console.log(data[0]);

    //put category on data
    sql = `select id, name from category_product cp inner join category c on cp.category_id = c.id where product_id = ?`;

    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      let [categories] = await conn.query(sql, element.id);
      data[i].categories = categories;
    }

    //put symptom
    sql = `select id, name from symptom_product sp inner join symptom s on sp.symptom_id = s.id where product_id = ?`;

    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      let [symptom] = await conn.query(sql, element.id);
      data[i].symptom = symptom;
    }

    //put image on data
    sql = `select image from product_image where product_id = ?`;

    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      let [images] = await conn.query(sql, element.id);
      data[i].images = images;
    }

    sql = `select count(*) as total_data from (select product.id, name, original_price, price, unit, no_obat, no_bpom,
      (select sum(quantity) from stock where product_id = product.id) as total_stock from product
      inner join category_product on product.id = category_product.product_id
      inner join (select name as type_name, id from type) as type on product.type_id = type.id
      inner join (select name as brand_name,id from brand) as brand on product.brand_id = brand.id
      inner join (select symptom_id,product_id from symptom_product ${symptom}) as symptom_product on product.id = symptom_product.product_id
      left join (select name as symptom_name, id from symptom) as symptom on symptom_id = symptom.id
      left join (select name as category_name, id from category) as kategori on category_id = kategori.id where true ${search} ${category} ${type} ${brand} ${priceRange} AND product.is_deleted = "NO"
      group by product.id) as table_data`;

    let [totalData] = await conn.query(sql);

    // res.set("x-total-product", totalData[0].total_data);

    // await conn.commit();
    conn.release();
    return { data, totalData };
  } catch (error) {
    console.log(error);
    // await conn.rollback();
    conn.release();
    throw new Error(error.message || error);
  }
};

// async (category_id) => {
//   let conn, sql;
//   try {
//     conn = await dbCon.promise().getConnection();

//     //get product for admin dashboard
//     sql = `select product.name, product.price, product.unit, category.name from category
//     join category_product on category.id = category_product.category_id
//     join product on product.id = category_product.product_id where category.id = ?`;

//     let [data] = await conn.query(sql, category_id);

//     //put image on data

//     // sql = `select image from product_image where product_id = ?`;

//     // const [resultImage] = await conn.query(sql, data[0].id);

//     // data[0] = { ...data[0], imageProduct: resultImage };

//     // console.log(data[0]);

//     return data;
//   } catch (error) {
//     throw new Error(error.message || error);
//   } finally {
//     conn.release();
//   }
// };

const editProductService = async (
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
  id,
  product_id,
  notDeletedImage
) => {
  let conn, sql;
  let jalur = "/image";

  console.log(image, "ini image");

  product_id = parseInt(product_id);
  console.log(product_id, "product_id");

  let symptomArr = JSON.parse(symptom_name);
  let categoryArr = JSON.parse(category_name);
  let notDeletedImageArr = JSON.parse(notDeletedImage);

  const imagearrpath = image
    ? image.map((val) => {
        return `${jalur}/${val.filename}`;
      })
    : [];

  console.log(imagearrpath, "line 551");
  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();

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
    sql = `UPDATE product SET ? WHERE id = ${product_id}`;
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

    let resultImageWillDelete;

    if (notDeletedImageArr.length) {
      //get id image yang akan dihapus
      sql = `SELECT id, image FROM product_image WHERE image NOT IN (?) AND product_id = ?`;
      [resultImageWillDelete] = await conn.query(sql, [
        notDeletedImageArr,
        product_id,
      ]);
    } else {
      sql = `SELECT id, image FROM product_image WHERE product_id = ?`;
      [resultImageWillDelete] = await conn.query(sql, [product_id]);
    }

    console.log(resultImageWillDelete, "line 671");
    //Delete Image
    sql = `DELETE FROM product_image WHERE id = ?`;

    for (let i = 0; i < resultImageWillDelete.length; i++) {
      await conn.query(sql, resultImageWillDelete[i].id);
      if (resultImageWillDelete[i].image) {
        fs.unlinkSync("./public" + resultImageWillDelete[i].image);
      }
    }

    // Insert posts_images
    sql = `INSERT INTO product_image set ?`;

    for (let i = 0; i < imagearrpath.length; i++) {
      let insertDataImage = {
        image: imagearrpath[i],
        product_id,
      };
      await conn.query(sql, [insertDataImage]);
    }

    // insert into stock

    // sql = `SELECT id FROM stock WHERE product_id = ? AND expired_at = FROM_UNIXTIME(?)`;

    // let [haveStockExp] = await conn.query(sql, [product_id, expired_at]);

    // if (haveStockExp.length) {
    //   sql = `UPDATE stock SET quantity = quantity + ?
    //   WHERE id = ?`;

    //   let resultStock = await conn.query(sql, [quantity, haveStockExp[0].id]);
    // } else {
    // sql = `UPDATE stock SET quantity = ?, expired_at = FROM_UNIXTIME(?) WHERE stock.product_id = ?`;
    // let [resultStock] = await conn.query(sql, [
    //   quantity,
    //   expired_at,
    //   product_id,
    // ]);
    // }

    //insert into symptom

    for (let i = 0; i < symptomArr.length; i++) {
      sql = `SELECT id FROM symptom WHERE name = ?`;
      let [haveSymptom] = await conn.query(sql, symptomArr[i]);

      if (haveSymptom.length) {
        sql = `SELECT symptom_id, product_id FROM symptom_product WHERE symptom_product.product_id = ? AND symptom_id = ?`;
        let [same] = await conn.query(sql, [product_id, haveSymptom[0].id]);

        if (!same.length) {
          let symptom_id = haveSymptom[0].id;
          sql = `INSERT INTO symptom_product (symptom_id, product_id) VALUES (?,?)`;
          await conn.query(sql, [symptom_id, product_id]);
        }
      } else {
        sql = `INSERT INTO symptom (name) VALUES (?)`;
        let [resultSymptomp] = await conn.query(sql, symptomArr[i]);
        let symptom_id = resultSymptomp.insertId;
        sql = `INSERT INTO symptom_product (symptom_id, product_id) VALUES (?,?)`;
        await conn.query(sql, [symptom_id, product_id]);
      }
    }

    // insert into category

    for (let i = 0; i < categoryArr.length; i++) {
      sql = `SELECT id FROM category WHERE name = ?`;
      let [haveCategory] = await conn.query(sql, categoryArr[i]);
      if (haveCategory.length) {
        sql = `SELECT category_id, product_id FROM category_product WHERE category_product.product_id = ? AND category_id = ?`;
        let [same] = await conn.query(sql, [product_id, haveCategory[0].id]);

        if (!same.length) {
          let category_id = haveCategory[0].id;
          sql = `INSERT INTO category_product (category_id, product_id) VALUES (?,?)`;
          await conn.query(sql, [category_id, product_id]);
        }
      } else {
        sql = `INSERT INTO category (name) VALUES (?)`;
        let [resultCategory] = await conn.query(sql, categoryArr[i]);
        let category_id = resultCategory.insertId;
        sql = `INSERT INTO category_product (category_id, product_id) VALUES (?,?)`;
        await conn.query(sql, [category_id, product_id]);
      }
    }

    await conn.commit();
    return { message: "Product Updated!" };
  } catch (error) {
    console.log(error);
    await conn.rollback();
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

const getProductTerkaitService = async (props) => {
  let conn, sql;
  // const { sypmtom_id } = props;
  let symptom_id = props.symptom_id;

  try {
    conn = await dbCon.promise().getConnection();

    // await conn.beginTransaction();

    // dapet product_id dari symptom_id dulu
    sql = `SELECT product_id FROM symptom_product WHERE symptom_id = ?`;
    let [productIdResult] = await conn.query(sql, symptom_id);

    console.log(productIdResult[0].product_id);

    let data = [];
    sql = `SELECT id, name, price, unit FROM product WHERE product.id = ? AND is_deleted ="NO" LIMIT 6`;
    for (let i = 0; i < productIdResult.length; i++) {
      const element = productIdResult[i];
      let [result] = await conn.query(sql, element.product_id);
      console.log(result, "ini result");
      data[i] = result[0];
    }

    console.log(data);

    sql = `SELECT image FROM product_image WHERE product_id = ? LIMIT 1`;
    for (let i = 0; i < data.length; i++) {
      const [resultImage] = await conn.query(sql, data[i].id);
      data[i] = { ...data[i], imageProduct: resultImage[0].image };
    }

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

    sql = `SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND is_deleted = 'NO'`;
    let [haveProduct] = await conn.query(sql, [id, product_id]);

    console.log(haveProduct, "haveproduct");

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

//Get Prescription Product
const getPrescriptionProductService = async () => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();
    // await conn.beginTransaction();

    sql = `select product.id, name, unit, original_price,
    (select sum(quantity) from stock where product_id = product.id) as total_stock from product
    inner join category_product on product.id = category_product.product_id
    left join (select name as category_name, id from category) as kategori on category_id = kategori.id where product.is_deleted = "NO"
    group by product.id;`;
    let [products] = await conn.query(sql);

    //Put category on data
    sql = `select id, name from category_product cp inner join category c on cp.category_id = c.id where product_id = ?`;

    for (let i = 0; i < products.length; i++) {
      const element = products[i];
      let [categories] = await conn.query(sql, element.id);
      products[i].categories = categories;
    }

    // await conn.commit();
    conn.release();
    return products;
  } catch (error) {
    console.log(error);
    // await conn.rollback();
    conn.release();
    throw new Error(error || "Network Error");
  }
};

const getQuantityProductService = async (dataInput) => {
  let conn, sql;
  console.log(dataInput, "ini data input");
  const { expired_at, product_id } = dataInput;
  console.log(expired_at, product_id);
  try {
    conn = await dbCon.promise().getConnection();
    // conn.beginTransaction();

    sql = `SELECT quantity FROM stock WHERE product_id = ? AND expired_at = ?`;
    let [resultQuantity] = await conn.query(sql, [product_id, expired_at]);
    if (!resultQuantity.length) {
      console.log("lewataku");
      result = {
        quantity: 0,
      };
      return { result, message: "Stock with the expired date not found." };
    }

    // await conn.commit();
    return {
      result: resultQuantity[0],
      message: "Get Quantity Product Success",
    };
  } catch (error) {
    console.log(error);
    // await conn.rollback();
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const updateStockService = async (data, user_id) => {
  let conn, sql;

  const { expired_at, quantity, product_id } = data;

  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    // 1. select stock where = tgl, kalo ada Update, kalo ga insert into
    sql = `SELECT id, quantity FROM stock WHERE expired_at = ? AND product_id = ?`;
    let [resultStock] = await conn.query(sql, [expired_at, product_id]);

    if (!resultStock.length) {
      sql = `INSERT INTO stock SET ?`;
      console.log("lewat sini gan");
      dataUpdate = {
        quantity,
        expired_at,
        product_id,
      };
      let [resultInputStock] = await conn.query(sql, dataUpdate);

      // 2. input log
      sql = `INSERT INTO log SET ?`;
      dataLog = {
        activity: "UPDATE STOCK",
        quantity: quantity,
        stock_id: resultInputStock.insertId,
        stock: quantity,
        user_id,
      };
      await conn.query(sql, dataLog);

      await conn.commit();
      return { message: "Update Stock Success!" };
    }
    //update stock
    sql = `UPDATE stock SET quantity = ? WHERE expired_at = ? AND product_id = ?`;
    let [resultUpdate] = await conn.query(sql, [
      quantity,
      expired_at,
      product_id,
    ]);

    let quantityBefore = resultStock[0].quantity;
    let quantityLog = quantity - quantityBefore;

    // 2. input log
    sql = `INSERT INTO log SET ?`;
    dataLog = {
      activity: "UPDATE STOCK",
      quantity: quantityLog,
      stock_id: resultStock[0].id,
      stock: quantity,
      user_id,
    };
    await conn.query(sql, dataLog);

    await conn.commit();
    return { message: "Update Stock Success!" };
  } catch (error) {
    console.log(error);
    await conn.rollback();
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

const getLogService = async (
  product_id,
  year,
  month,
  activity,
  page,
  limit
) => {
  let sql, conn;
  year = parseInt(year);
  month = parseInt(month);

  console.log(page, limit, activity, "page & limit");

  // filter tahun bulan
  if (!year && !month) {
    console.log("lewat !year && !month");
    year = ``;
    month = ``;
  } else if (year && !month) {
    console.log("lewat year && !month");
    year = `AND log.created_at >= '${year}-01-01' AND log.created_at <= '${year}-12-31'`;
  } else if (year && month) {
    year = `AND log.created_at >= '${year}-01-01' AND log.created_at <= '${year}-12-31' AND month(log.created_at) = ${month}`;
  }

  //filter activity
  if (!activity) {
    activity = ``;
  } else {
    activity = activity.replace(/_/g, " ");
    activity = `AND activity = '${activity}'`;
  }

  if (!page) {
    page = 0;
  }

  if (!limit) {
    limit = 10;
  }

  limit = parseInt(limit);
  let offset = parseInt(page) * parseInt(limit);

  try {
    conn = await dbCon.promise().getConnection();
    // await conn.beginTransaction();

    sql = `SELECT log.id, log.created_at, log.activity, user.fullname, log.quantity, log.stock, stock.expired_at FROM log
    LEFT JOIN stock on log.stock_id = stock.id
    LEFT JOIN product on stock.product_id = product.id
    LEFT JOIN user on log.user_id = user.id
    WHERE product_id = ?
    ${year}
    ${activity}
    ORDER BY log.created_at DESC
    LIMIT ${dbCon.escape(offset)}, ${dbCon.escape(limit)}`;

    let [result] = await conn.query(sql, product_id);
    console.log(result, "ini result");
    let mapedResult = result.map((val, i) => {
      if (val.quantity < 0) {
        return {
          ...val,
          created_at: dayjs(val.created_at).format("DD MMMM YYYY"),
          expired_at: dayjs(val.expired_at).format("DD MMMM YYYY"),
          keluar: val.quantity * -1,
          masuk: 0,
          num: page * limit + (1 + i),
        };
      } else {
        return {
          ...val,
          created_at: dayjs(val.created_at).format("DD MMMM YYYY"),
          expired_at: dayjs(val.expired_at).format("DD MMMM YYYY"),
          keluar: 0,
          masuk: val.quantity,
          num: page * limit + (1 + i),
        };
      }
    });

    mapedResult.forEach((object) => {
      delete object["quantity"];
    });

    // count product yang terfilter
    sql = `select count(*) as total_data from (SELECT log.id, log.created_at, log.activity, user.fullname, log.quantity, log.stock, stock.expired_at FROM log
    LEFT JOIN stock on log.stock_id = stock.id
    LEFT JOIN product on stock.product_id = product.id
    LEFT JOIN user on log.user_id = user.id
    WHERE product_id = ?
    ${year}
    ${activity}) as table_data`;

    let [totalData] = await conn.query(sql, product_id);

    // count total stock yang ada
    sql = `SELECT name, sum(quantity) total_quantity FROM stock
    LEFT JOIN product ON stock.product_id = product.id
    WHERE product.id = ?`;

    let [totalStock] = await conn.query(sql, product_id);

    // await conn.commit();
    return {
      result: mapedResult,
      totalData,
      detailProduct: totalStock[0],
      message: "Update Stock Success!",
    };
  } catch (error) {
    console.log(error);
    // await conn.rollback();
    throw new Error(error || "Network Error");
  } finally {
    conn.release();
  }
};

//Get Carousel Diskon Hari ini
const getProductsDiscountService = async () => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `select product.id, name, price, unit, type_name, brand_name from product
    inner join (select name as type_name, id from type) as type on product.type_id = type.id
    inner join (select name as brand_name,id from brand) as brand on product.brand_id = brand.id
    where true AND product.is_deleted = "NO" LIMIT 0, 7`;

    let [productDiscount] = await conn.query(sql);

    //put image on data
    sql = `select image from product_image where product_id = ?`;

    for (let i = 0; i < productDiscount.length; i++) {
      const element = productDiscount[i];
      let [images] = await conn.query(sql, element.id);
      productDiscount[i].images = images;
    }

    conn.release();
    return { productDiscount };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error || "Network Error");
  }
};

//Delete Stock CRON
const deleteStockCRON = async () => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();

    sql = `select * from stock where expired_at = current_date() and quantity > 0`;
    let [expiredStocks] = await conn.query(sql);

    for (let i = 0; i < expiredStocks.length; i++) {
      const element = expiredStocks[i];
      //Delete Stock
      sql = `update stock set ? where id = ?`;
      let updateStock = {
        quantity: 0,
      };
      await conn.query(sql, [updateStock, element.id]);
      console.log(`kedelete yang ini-${element.id}`);

      //Insert Into Log
      sql = `insert into log set ?`;
      let insertLog = {
        activity: "CLEARED BY SYSTEM",
        quantity: parseInt(element.quantity) * -1,
        stock: 0,
        stock_id: element.id,
      };
      await conn.query(sql, insertLog);
      console.log(`diinput yang ini-${element.id}`);
    }

    await conn.commit();
    conn.release();
    return { message: "Deleted Automatically" };
  } catch (error) {
    console.log(error);
    await conn.rollback();
    conn.release();
    throw new Error(error.message || error);
  }
};

schedule.scheduleJob("*/5 * * * *", () => {
  deleteStockCRON();
});

module.exports = {
  inputProductService,
  getCategoryService,
  getSymptomService,
  getTypeService,
  deleteProductService,
  getAllProductService,
  getProductService,
  editProductService,
  getCategoryListService,
  getHomeProductService,
  getProductTerkaitService,
  inputCartService,
  getPrescriptionProductService,
  updateStockService,
  getQuantityProductService,
  getLogService,
  getProductsDiscountService,
};
