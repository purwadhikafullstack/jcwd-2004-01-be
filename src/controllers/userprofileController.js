const { userprofileService } = require("./../services");
const {
  updateFullnameService,
  updateBirthDateService,
  updateEmailService,
  updateGenderService,
  updatePhonenumberService,
  updateUsernameService,
  updateProfilePictureService,
  deleteProfilePictureService,
  getUpdatedUserprofileDataService,
  getProvincesService,
  getCitiesService,
  addAddressService,
  updateDefaultAddressService,
  getAddressService,
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

//Update profile picture
const updateProfilePicture = async (req, res) => {
  const { id } = req.user;
  const profile_picture = req.file;
  console.log(req.file, "ini req.file");
  try {
    const { data } = await updateProfilePictureService(profile_picture, id);
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Delete profile picture
const deleteProfilePicture = async (req, res) => {
  const { id } = req.user;
  const imagePath = null;
  try {
    const { data } = await deleteProfilePictureService(imagePath, id);
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

//Get Provinces
const getProvinces = async (req, res) => {
  try {
    const { data } = await getProvincesService();
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Get Cities
const getCities = async (req, res) => {
  const { province_id } = req.params;
  try {
    const { data } = await getCitiesService(province_id);
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Get user addresses
const getAddress = async (req, res) => {
  const { id } = req.user;
  try {
    const { data } = await getAddressService(id);
    console.log(data);
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Add address
const addAddress = async (req, res) => {
  const { id } = req.user;
  try {
    await addAddressService(req.body, id);
    return res.status(200).send({ message: "berhasil add data" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Update default address
const updateDefaultAddress = async (req, res) => {
  const { id } = req.user;
  const { address_id } = req.params;
  try {
    const { data } = await updateDefaultAddressService(id, address_id);
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
  updateProfilePicture,
  deleteProfilePicture,
  getUpdatedUserprofileData,
  getProvinces,
  getCities,
  addAddress,
  updateDefaultAddress,
  getAddress,
};
