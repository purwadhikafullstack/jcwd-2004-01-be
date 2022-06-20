const { userprofileService } = require("./../services");
const {
  updateFullnameService,
  updateBirthDateService,
  updateEmailService,
  updateGenderService,
  updatePhonenumberService,
  updateUsernameService,
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

module.exports = {
  updateUsername,
};
