const { transactionService } = require("./../services");
const {
  uploadPrescriptionService,
  inputCartService,
  getCartService,
  updateQuantityService,
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

module.exports = {
  inputCartController,
  getCartController,
  updateQuantityController,
  uploadPrescription,
};
