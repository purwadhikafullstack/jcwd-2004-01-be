const { transactionService } = require("./../services");
const { uploadPrescriptionService } = transactionService;

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
  uploadPrescription,
};
