const { createJwtAccess, createJwtEmail } = require("../lib/jwt");
const {
  registerService,
  loginService,
  sendEmailService,
  changePassword,
  loginAdminService,
} = require("../services/authenticationService");
const { dbCon } = require("./../connection");
const myCache = require("./../lib/cache");

//Register Controller
const register = async (req, res) => {
  try {
    const { data: userData } = await registerService(req.body);

    let timecreated = new Date().getTime();
    const dataToken = {
      id: userData.id,
      username: userData.name,
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
    let templateDir = "../templates/verificationTemplate.html";
    let title = "Verify it's you!";
    await sendEmailService(userData, tokenEmail, templateDir, title);

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
    const { data: userData } = await loginAdminService(req.body);

    //Create data token
    const dataToken = {
      id: userData.id,
      username: userData.username,
      role_id: userData.role_id,
    };

    //Create token acces
    const tokenAccess = createJwtAccess(dataToken);
    res.set("x-token-access", tokenAccess);
    console.log(tokenAccess);
    return res.status(200).send(userData);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { data: userData } = await loginAdminService(req.body);

    //Create data token
    const dataToken = {
      id: userData.id,
      username: userData.username,
      role_id: userData.role_id,
    };

    //Create token acces
    const tokenAccess = createJwtAccess(dataToken);
    res.set("x-token-access", tokenAccess);
    console.log(tokenAccess);
    return res.status(200).send(userData);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Keep Login
const keepLogin = async (req, res) => {
  const { id } = req.user;
  let conn, sql;
  try {
    conn = await dbCon.promise();
    sql = `select * from user where id = ?`;
    let [result] = await conn.query(sql, [id]);
    return res.status(200).send(result[0]);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Account Verification
const verifyAccount = async (req, res) => {
  const { id } = req.user;
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();

    //Check user's verification status
    sql = `select id from user where id = ? and is_verified = 1`;
    let [userVerified] = await conn.query(sql, [id]);

    if (userVerified.length) {
      throw { message: "Your account is already verified" };
    }

    //Verify user
    sql = `update user set ? where id = ?`;
    let updateData = {
      is_verified: 1,
    };
    await conn.query(sql, [updateData, id]);
    sql = `select id,name,is_verified,email from user where id = ?`;
    let [result] = await conn.query(sql, [id]);
    await conn.commit();
    conn.release();
    return res.status(200).send(result[0]);
  } catch (error) {
    conn.rollback();
    conn.release();
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Send email forgot password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  let sql, conn;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `select email, name, id from user where email = ?`;

    let [result] = await conn.query(sql, email);

    //Create something unique
    let timecreated = new Date().getTime();
    const dataToken = {
      id: result[0].id,
      username: result[0].name,
      email: result[0].email,
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
    let templateDir = "../templates/verificationTemplate.html";
    let title = "Reset password";

    await sendEmailService(result[0], tokenEmail, templateDir, title);

    conn.release();
    // res.set("x-token-access", tokenEmail);
    return res.status(200).send({ message: "Email sent!" });
  } catch (error) {
    console.log(error);
    conn.release();
    return res.status(500).send({ message: error.message || error });
  }
};

//Reset or forgot password
const resetPassword = async () => {
  const { id } = req.user;
  try {
    const { data: userData } = await changePassword(req.body, id);
    return res.status(200).send(userData);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message || error });
  }
};

//Email verification
const sendEmailVerification = async (req, res) => {
  const { id } = req.user;
  console.log(req.user);

  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `select id, username, email from user where id = ?`;

    let [result] = await conn.query(sql, id);
    //Create something unique
    let timecreated = new Date().getTime();
    const dataToken = {
      id: id,
      username: result[0].username,
      email: result[0].email,
      timecreated,
    };

    //Caching
    let caching = myCache.set(id, dataToken, 300);
    if (!caching) {
      throw "Caching failed";
    }

    //Create token email
    const tokenEmail = createJwtEmail(dataToken);

    //kirim email verifikasi
    let templateDir = "../templates/verificationTemplate.html";
    let title = "Verify it's you";

    await sendEmailService(result[0], tokenEmail, templateDir, title);

    conn.release();
    return res.status(200).send({ message: "Email sent successfully" });
  } catch (error) {
    console.log(error);
    conn.release();
    return res.status(200).send({ message: error.message || error });
  }
};

module.exports = {
  register,
  login,
  keepLogin,
  forgotPassword,
  resetPassword,
  sendEmailVerification,
  verifyAccount,
  loginAdmin,
};
