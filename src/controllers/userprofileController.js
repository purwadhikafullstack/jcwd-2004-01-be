const { userprofileService } = require("./../services");
const {
  updateFullnameService,
  updateBirthDateService,
  updateEmailService,
  updateGenderService,
  updatePhonenumberService,
  updateUsernameService,
  getUpdatedUserprofileDataService,
} = userprofileService;

//Update Username
const updateUsername = async (req, res) => {
  const { id } = req.user;
  try {
    const { data } = await updateUsernameService(req.body, id);
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Update Phonenumber
const updatePhonenumber = async (req, res) => {
  const { id } = req.user;
  try {
    const { data } = await updatePhonenumberService(req.body, id);
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Update Fullname
const updateFullname = async (req, res) => {
  const { id } = req.user;
  try {
    const { data } = await updateFullnameService(req.body, id);
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Update Email
const updateEmail = async (req, res) => {
  const { id } = req.user;
  try {
    const { data } = await updateEmailService(req.body, id);
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Update Gender
const updateGender = async (req, res) => {
  const { id } = req.user;
  try {
    const { data } = await updateGenderService(req.body, id);
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Update Birthdate
const updateBirthdate = async (req, res) => {
  const { id } = req.user;
  try {
    const { data } = await updateBirthDateService(req.body, id);
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Get Updated User Profile Data
const getUpdatedUserprofileData = async (req, res) => {
  const { id } = req.user;
  try {
    const { data } = await getUpdatedUserprofileDataService(id);
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

module.exports = {
  updateUsername,
  updatePhonenumber,
  updateFullname,
  updateEmail,
  updateGender,
  updateBirthdate,
  getUpdatedUserprofileData,
};
