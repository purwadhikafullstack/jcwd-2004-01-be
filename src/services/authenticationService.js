const { dbCon } = require("../connection");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { generateFromEmail } = require("unique-username-generator");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const path = require("path");
const fs = require("fs");

//Password Hashing & Comparing
const hashPassword = async (inputPassword) => {
  const hash = await bcrypt.hash(inputPassword, 10);
  return hash;
};

const comparePassword = async (inputPassword, storedPassword) => {
  const compare = await bcrypt.compare(inputPassword, storedPassword);
  return compare;
};

// Register Service
const registerService = async (data) => {
  let { name, email, password } = data;
  let conn, sql, username;
  try {
    conn = await dbCon.promise().getConnection();

    //Generate Username
    username = name;

    //Check username and email availability
    sql = `select id from user where username = ? or email = ?`;
    let [result] = await conn.query(sql, [username, email]);
    if (result.length) {
      throw "Username or email has already been used";
    }

    //Insert user's data into table
    sql = `INSERT INTO user set ?`;
    let insertData = {
      username: username,
      email,
      password: await hashPassword(password),
    };
    let [result1] = await conn.query(sql, insertData);

    //Send user data
    sql = `select id,username,email,role_id from user where id = ?`;
    let [userData] = await conn.query(sql, [result1.insertId]);
    conn.release();
    return { data: userData[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Login Service
const loginService = async (data) => {
  let { username, email, password } = data;
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    //Check user data
    sql = `select id, is_verified, role_id, email, fullname, password from user where (username = ? or email = ?)`;
    let [result] = await conn.query(sql, [username, email]);
    if (!result.length) {
      throw "User not found";
    }
    if ((await comparePassword(password, result[0].password)) === false) {
      throw "Credential mismatch";
    }

    delete result[0].password;

    conn.release();

    //Send user data
    return { data: result[0] };
  } catch (error) {
    conn.release();
    console.log(error);
    throw new Error(error || "Network Error");
  }
};

//Keep Login Service
const keepLoginService = async (id) => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();
    sql = `select id, username, role_id, is_verified, fullname, profile_picture from user where id = ?`;
    let [result] = await conn.query(sql, [id]);

    return { data: result[0] };
  } catch (error) {
    console.log(error);
    throw new Error(error.message || error);
  } finally {
    conn.release();
  }
};

//Verify Account Service
const verifyAccountService = async (id) => {
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
      is_verified: 2,
    };
    await conn.query(sql, [updateData, id]);
    sql = `select id,username,is_verified,email from user where id = ?`;
    let [result] = await conn.query(sql, [id]);
    await conn.commit();
    conn.release();
    return { data: result[0] };
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.log(error);
    throw new Error(error.message || error);
  }
};

//Forgot Password Service
const forgotPasswordService = async (email) => {
  let sql, conn;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `select email, username, id from user where email = ?`;

    let [result] = await conn.query(sql, email);

    conn.release();
    // res.set("x-token-access", tokenEmail);
    return { data: result[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    return { message: error.message || error };
  }
};

//Verifyme Service
const verifymeService = async (id) => {
  let sql, conn;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `select id, username, email from user where id = ?`;

    let [result] = await conn.query(sql, id);
    conn.release();
    return { data: result[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    return { message: error.message || error };
  }
};

//Send Email Service
const sendEmailService = async (
  userData,
  tokenEmail,
  templateDir,
  title,
  route
) => {
  try {
    //Nodemailer
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "funfungoodtime@gmail.com",
        pass: "voanbrxeknnugfcw",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    //Email
    const host =
      process.env.NODE_ENV === "production"
        ? "https://jcwd200401.purwadhikabootcamp.com"
        : "http://localhost:3000";
    const link = `${host}/${route}/${tokenEmail}`;

    let filepath = path.resolve(__dirname, templateDir);

    let htmlString = fs.readFileSync(filepath, "utf-8");

    const template = handlebars.compile(htmlString);

    const htmlToEmail = template({ username: userData.username, link });

    //Send Email
    await transporter.sendMail({
      from: "Healthymed <funfungoodtime@gmail.com>",
      to: userData.email,
      subject: title,
      html: htmlToEmail,
    });
    return { message: "Email successfully sent" };
  } catch (error) {
    console.log(error);
    throw new Error(error || "Network Error");
  }
};

//Reset password
const resetPassword = async (data, id) => {
  // const { id } = req.user
  const { password } = data;

  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    sql = `update user set ? where id = ?`;

    let updateData = {
      password: await hashPassword(password),
    };

    await conn.query(sql, [updateData, id]);

    sql = `select * from user where id = ?`;

    let [userData] = await conn.query(sql, id);

    conn.release();
    return { data: userData[0] };
  } catch (error) {
    conn.release();
    throw new Error(error.message || error);
  }
};

//Change Password
const changePassword = async (data, id) => {
  const { oldPassword, newPassword } = data;

  let conn, sql;

  try {
    conn = await dbCon.promise().getConnection();

    sql = `select password from user where id = ?`;
    let [userPassword] = await conn.query(sql, id);
    if (
      (await comparePassword(oldPassword, userPassword[0].password)) === false
    ) {
      throw "Wrong password!";
    }

    if (
      (await comparePassword(newPassword, userPassword[0].password)) === true
    ) {
      throw "Please input new password!";
    }

    sql = `update user set ? where id = ?`;

    let updateData = {
      password: await hashPassword(newPassword),
    };

    await conn.query(sql, [updateData, id]);

    sql = `select * from user where id = ?`;

    let [userData] = await conn.query(sql, id);

    conn.release();
    return { data: userData[0] };
  } catch (error) {
    conn.release();
    throw new Error(error.message || error);
  }
};

module.exports = {
  registerService,
  loginService,
  sendEmailService,
  keepLoginService,
  verifyAccountService,
  forgotPasswordService,
  resetPassword,
  changePassword,
  verifymeService,
  changePassword,
};
