const { getFeeService } = require("../services/transactionService");
const { transactionService } = require("./../services");
const {
  uploadPrescriptionService,
  inputCartService,
  getCartService,
  updateQuantityService,
  getBankService,
  deleteCartService,
  checkoutService,
} = transactionService;

const inputCartController = async (req, res) => {
  const { id } = req.user;
  const { product_id, quantity } = req.body;
  try {
    let result = await inputCartService(id, product_id, quantity);

    return res
      .status(200)
      .send({ result, message: "Input Product to Cart Success!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

const getCartController = async (req, res) => {
  const { id } = req.user;

  try {
    let result = await getCartService(id);

    return res.status(200).send({ result, message: "Get Cart Success!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

const updateQuantityController = async (req, res) => {
  const { currentQuantity, cart_id } = req.body;

  console.log(currentQuantity, cart_id);

  try {
    let result = await updateQuantityService(currentQuantity, cart_id);

    return res
      .status(200)
      .send({ result, message: "Update Quantity Success!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Upload Prescription
const uploadPrescription = async (req, res) => {
  const { img } = req.files;
  const { id } = req.user;
  try {
    const data = await uploadPrescriptionService(img, id);
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//get bank
const getBankController = async (req, res) => {
  try {
    const result = await getBankService();
    return res.status(200).send({ result, message: "Get Bank Success!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

// delete Cart
const deleteCartController = async (req, res) => {
  const { id } = req.body;
  try {
    await deleteCartService(id);
    return res.status(200).send({ message: "Cart Deleted!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

// get delivery fee raja ongkir

const getFeeController = async (req, res) => {
  const { cityId } = req.query;
  console.log(req.query, "hehu");
  try {
    let response = await getFeeService(cityId);
    return res.status(200).send({ value: response });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

const checkoutController = async (req, res) => {
  // const { data } = req.body;
  // console.log(req.body, "req.body");
  try {
    let response = checkoutService(req.body);

    return res
      .status(200)
      .send({ data: response, message: "success Checkout!" });
  } catch (error) {
    return res.status(500).send(error);
  }
};

module.exports = {
  inputCartController,
  getCartController,
  updateQuantityController,
  uploadPrescription,
  getBankController,
  deleteCartController,
  getFeeController,
  checkoutController,
};
