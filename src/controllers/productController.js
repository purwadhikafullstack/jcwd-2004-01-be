const {
  inputProductService,
  getSymptomService,
  getTypeService,
  deleteProductService,
  getCategoryService,
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
    return res.status(200).send(result);
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
};
