const { transactionService } = require("./../services");
const {
  uploadPrescriptionService,
  inputCartService,
  getCartService,
  updateQuantityService,
  getPrescriptionTransactionListService,
  submitPrescriptionCopyService,
  rejectOrderService,
  acceptOrderService,
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

//Accept Order
const acceptOrder = async (req, res) => {
  const { transaction_id } = req.params;
  try {
    await acceptOrderService(transaction_id);
    return res.status(200).send({ message: "Order Accepted" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Reject Order
const rejectOrder = async (req, res) => {
  const { transaction_id } = req.params;
  try {
    await rejectOrderService(transaction_id);
    return res.status(200).send({ message: "Order Rejected" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Get Prescription Transaction List
const getPrescriptionTransactionList = async (req, res) => {
  try {
    const data = await getPrescriptionTransactionListService();
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Submit Prescription Copy
const submitPrescriptionCopy = async (req, res) => {
  const { transaction_id } = req.params;
  try {
    const { data } = await submitPrescriptionCopyService(
      req.body,
      transaction_id
    );
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
  getPrescriptionTransactionList,
  submitPrescriptionCopy,
  acceptOrder,
  rejectOrder,
};
