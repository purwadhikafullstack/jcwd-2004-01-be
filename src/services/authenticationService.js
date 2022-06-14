const { dbCon } = require("../connection");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { generateFromEmail } = require("unique-username-generator");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");

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
    username = generateFromEmail(email);

    //Check username and email availability
    sql = `select id from user where name = ? or email = ?`;
    let [result] = await conn.query(sql, [username, email]);
    if (result.length) {
      throw { message: "Username or email has already been used" };
    }

    //Insert user's data into table
    sql = `INSERT INTO user set ?`;
    let insertData = {
      name: username,
      email,
      password: await hashPassword(password),
    };
    let [result1] = await conn.query(sql, insertData);

    //Send user data
    sql = `select id,name,email,role_id from user where id = ?`;
    let [userData] = await conn.query(sql, [result1.insertId]);
    conn.release();
    return { data: userData[0] };
  } catch (error) {
    conn.release();
    throw new Error(error.message || error);
  }
};

//Login Service
const loginService = async (data) => {
  let { name, email, password } = data;
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    //Check user data
    sql = `select * from user where (username = ? or email = ?)`;
    let [result] = await conn.query(sql, [name, email]);
    if (!result.length) {
      throw "User not found";
    }
    if ((await comparePassword(password, result[0].password)) === false) {
      throw "Credential mismatch";
    }
    conn.release();

    //Send user data
    return { data: result[0] };
  } catch (error) {
    conn.release();
    console.log(error);
    throw new Error(error || "Network Error");
  }
};

// login admin service
const loginAdminService = async (data) => {
  let { name, email, password } = data;
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    //Check user data
    sql = `select * from user where (username = ? or email = ?)`;
    let [result] = await conn.query(sql, [name, email]);

    if (!result.length) {
      throw "User not found";
    }
    if ((await comparePassword(password, result[0].password)) === false) {
      throw "Credential mismatch";
    }
    if (result[0].role_id != 1) {
      throw "you are not an admin!";
    }
    conn.release();

    //Send user data
    return { data: result[0] };
  } catch (error) {
    conn.release();
    console.log(error);
    throw new Error(error || "Network Error");
  }
};

//Send Email Service
const sendEmailService = async (userData, tokenEmail, templateDir, title) => {
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
        ? "http://namadomain.com"
        : "http://localhost:3000";
    const link = `${host}/verification/${tokenEmail}`;

    let filepath = path.resolve(__dirname, templateDir);

    let htmlString = fs.readFileSync(filepath, "utf-8");

    const template = handlebars.compile(htmlString);

    const htmlToEmail = template({ username: userData.name, link });

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

//Change password
const changePassword = async (data, id) => {
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

module.exports = {
  registerService,
  loginService,
  sendEmailService,
  changePassword,
  loginAdminService,
};
