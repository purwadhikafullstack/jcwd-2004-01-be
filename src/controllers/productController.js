const { dbCon } = require("../connection");
const { connect } = require("../connection/finalprojectdb");
const {
  inputProductService,
  getSymptomService,
  getTypeService,
  deleteProductService,
  getCategoryService,
  getAllProductService,
  getProductService,
  editProductService,
  getCategoryListService,
  getHomeProductService,
  getProductTerkaitService,
  inputCartService,
} = require("../services/productService");

const inputProductController = async (req, res) => {
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
    category_name, //category table
  } = req.body;
  const { image } = req.files;

  console.log("image", image);

  try {
    await inputProductService(
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
    );

    return res.status(200).send({ message: "input product success!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

const getCategory = async (req, res) => {
  try {
    const result = await getCategoryService();
    return res.status(200).send(result);
  } catch (error) {
    return res.status(500).send({ message: error.message || error });
  }
};

const getSymptom = async (req, res) => {
  try {
    const result = await getSymptomService();
    return res.status(200).send(result);
  } catch (error) {
    return res.status(500).send({ message: error.message || error });
  }
};

const getType = async (req, res) => {
  try {
    const result = await getTypeService();
    return res.status(200).send(result);
  } catch (error) {
    return res.status(500).send({ message: error.message || error });
  }
};

const deleteProductController = async (req, res) => {
  const { id } = req.query;
  const data = { id: id };
  try {
    const result = await deleteProductService(data);
    return res.status(200).send({ message: "Delete product success!" });
  } catch (error) {
    return res.status(500).send({ message: error.message || error });
  }
};

const getAllProductController = async (req, res) => {
  let { search, page, limit, category, orderName, orderPrice } = req.query;
  console.log(req.query);
  console.log(search, page, limit, category, orderName, orderPrice);
  try {
    const result = await getAllProductService(
      search,
      page,
      limit,
      category,
      orderName,
      orderPrice
    );

    res.set("x-total-product", result.totalData[0].total_data);
    return res.status(200).send(result.data);
  } catch (error) {
    return res.status(500).send({ message: error.message || error });
  }
};

const getProductController = async (req, res) => {
  let { id } = req.query;
  console.log(req.query);
  console.log(id);
  try {
    const result = await getProductService(id);

    return res.status(200).send(result);
  } catch (error) {
    return res.status(500).send({ message: error.message || error });
  }
};

const editProductController = async (req, res) => {
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
    category_name, //category table
    product_id,
    notDeletedImage,
  } = req.body;
  const { image } = req.files;

  console.log("image", image);

  try {
    let result = await editProductService(
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
    );

    return res.status(200).send({ message: "input product success!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

// Get Category List
const getCategoryList = async (req, res) => {
  try {
    const data = await getCategoryListService();
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

const getProductTerkaitController = async (req, res) => {
  try {
    let result = await getProductTerkaitService(req.query);

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

const inputCartController = async (req, res) => {
  const { id } = req.user;
  const { product_id, quantity } = req.body;
  try {
    let result = await inputCartService(id, product_id, quantity);

    return res
      .status(200)
      .send({ result, message: "Input Product to Cart Success!" });
  } catch (error) {
    return res.status(500).send({ message: error.message || error });
  }
};
//Get Home Product
// const getHomeProduct = async (req, res) => {
//   const { category_id } = req.params;
//   try {
//     const data = await getHomeProductService(category_id);
//     return res.status(200).send(data);
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ message: error.message || error });
//   }
// };
const getHomeProduct = async (req, res) => {
  let {
    search,
    page,
    limit,
    category,
    orderName,
    orderPrice,
    symptom,
    type,
    brand,
  } = req.query;
  // console.log(req.query);
  // console.log(search, page, limit, category, orderName, orderPrice);
  try {
    const result = await getHomeProductService(
      search,
      page,
      limit,
      category,
      orderName,
      orderPrice,
      symptom,
      type,
      brand
    );

    res.set("x-total-product", result.totalData[0].total_data);
    return res.status(200).send(result.data);
  } catch (error) {
    return res.status(500).send({ message: error.message || error });
  }
};

module.exports = {
  inputProductController,
  getCategory,
  getSymptom,
  getType,
  deleteProductController,
  getAllProductController,
  getProductController,
  editProductController,
  getCategoryList,
  getHomeProduct,
  getProductTerkaitController,
  inputCartController,
};
