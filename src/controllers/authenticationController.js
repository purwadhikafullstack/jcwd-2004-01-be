const { createJwtAccess, createJwtEmail } = require("../lib/jwt");
const { authenticationService } = require("./../services");
const {
  registerService,
  loginService,
  sendEmailService,
  keepLoginService,
  resetPassword,
  verifyAccountService,
  forgotPasswordService,
  verifymeService,
  changePassword,
} = authenticationService;
const { dbCon } = require("./../connection");
const myCache = require("./../lib/cache");

//Register Controller
const register = async (req, res) => {
  try {
    const { data: userData } = await registerService(req.body);

    let timecreated = new Date().getTime();
    const dataToken = {
      id: userData.id,
      username: userData.username,
      role_id: userData.role_id,
      timecreated,
    };

    let caching = myCache.set(userData.id, dataToken, 300);
    if (!caching) {
      throw "Caching failed";
    }

    //Create Token Access and Token Email
    const tokenAccess = createJwtAccess(dataToken);
    const tokenEmail = createJwtEmail(dataToken);

    //Send email
    let templateDir = "../templates/verificationTemplate_V1.html";
    let title = "Verify it's you!";
    let route = "verification";
    await sendEmailService(userData, tokenEmail, templateDir, title, route);

    //Send user data and token to log in
    res.set("x-token-access", tokenAccess);
    return res.status(200).send(userData);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Login Controller
const login = async (req, res) => {
  try {
    const { data: userData } = await loginService(req.body);

    //Create data token
    const dataToken = {
      id: userData.id,
      username: userData.username,
      role_id: userData.role_id,
    };

    //Create token acces
    const tokenAccess = createJwtAccess(dataToken);
    res.set("x-token-access", tokenAccess);
    // console.log(tokenAccess);
    return res
      .status(200)
      .send({ data: userData, message: "Successfully logged in!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Keep Login
const keepLogin = async (req, res) => {
  const { id } = req.user;
  try {
    const { data } = await keepLoginService(id);
    console.log(data.name, "ini data bosq");
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Account Verification
const verifyAccount = async (req, res) => {
  const { id } = req.user;
  try {
    const { data } = await verifyAccountService(id);
    return res.status(200).send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Send email forgot password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const { data } = await forgotPasswordService(email);

    //Create something unique
    let timecreated = new Date().getTime();
    const dataToken = {
      id: data.id,
      username: data.username,
      email: data.email,
      timecreated,
    };

    //Caching
    let caching = myCache.set(email, dataToken, 300);
    if (!caching) {
      throw "Caching failed";
    }

    //Create token email
    const tokenEmail = createJwtEmail(dataToken);

    //Send email
    let templateDir = "../templates/verificationTemplate_V2.html";
    let title = "Reset password";
    let route = "resetpassword";

    await sendEmailService(data, tokenEmail, templateDir, title, route);

    // res.set("x-token-access", tokenEmail);
    return res.status(200).send({ message: "Email sent!" });
  } catch (error) {
    console.log(error);
    conn.release();
    return res.status(500).send({ message: error.message || error });
  }
};

//Reset or forgot password
const resetForgotPassword = async (req, res) => {
  const { id } = req.user;
  try {
    const { data: userData } = await resetPassword(req.body, id);
    return res.status(200).send(userData);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Change Password
const changeNewPassword = async (req, res) => {
  const { id } = req.user;
  try {
    const { data: userData } = await changePassword(req.body, id);
    return res.status(200).send(userData);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//VerifyMe
const verifyMe = async (req, res) => {
  const { id } = req.user;
  try {
    const { data } = await verifymeService(id);

    //Create something unique
    let timecreated = new Date().getTime();
    const dataToken = {
      id: id,
      username: data.username,
      email: data.email,
      timecreated,
    };

    //Caching
    let caching = myCache.set(id, dataToken, 300);
    if (!caching) {
      throw "Caching failed";
    }

    const tokenEmail = createJwtEmail(dataToken);

    //Send email
    let templateDir = "../templates/verificationTemplate_V1.html";
    let title = "Verify it's you";
    let route = "verification";

    await sendEmailService(data, tokenEmail, templateDir, title, route);

    return res.status(200).send({ message: "Email sent successfully" });
  } catch (error) {
    console.log(error);
    return res.status(200).send({ message: error.message || error });
  }
};

const checklRole = async (req, res) => {
  try {
    return res.status(200).send(req.user);
  } catch (error) {
    return res.status(200).send({ message: error.message || error });
  }
};

module.exports = {
  register,
  login,
  keepLogin,
  forgotPassword,
  resetForgotPassword,
  verifyMe,
  verifyAccount,
  checklRole,
  changeNewPassword,
};
