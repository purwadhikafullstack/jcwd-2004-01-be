const { dbCon } = require("./../connection");
const fs = require("fs");

//Fullname Service
const updateFullnameService = async (data, id) => {
  const { fullname } = data;

  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `update user set ? where id = ?`;
    await conn.query(sql, [{ fullname: fullname }, id]);

    sql = `select fullname from user where id = ?`;
    let [result] = await conn.query(sql, id);

    conn.release();
    return { data: result[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Username Service
const updateUsernameService = async (data, id) => {
  const { username } = data;

  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `select username from user where id = ?`;
    let [result] = await conn.query(sql, id);
    if (result[0].username == username) {
      throw "Username must be different!";
    }

    sql = `select id from user where username = ?`;
    let [result1] = await conn.query(sql, username);
    if (result1.length) {
      throw "Username has already been used";
    }

    sql = `update user set ? where id = ?`;
    await conn.query(sql, [{ username: username }, id]);

    sql = `select username from user where id = ?`;
    let [result2] = await conn.query(sql, id);

    conn.release();
    return { data: result2[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Phonenumber Service
const updatePhonenumberService = async (data, id) => {
  const { phonenumber } = data;

  let conn, sql;
  try {
    conn = await dbCon.promies().getConnection();

    sql = `select phonenumber from user where id = ?`;
    let [result] = await conn.query(sql, id);
    if (result[0].phonenumber == phonenumber) {
      throw "Phonenumber must be different!";
    }

    sql = `select id from user where phonenumber = ?`;
    let [result1] = await conn.query(sql, phonenumber);
    if (result1.length) {
      throw "Phonenumber has already been used";
    }

    sql = `update user set ? where id = ?`;
    await conn.query(sql, [{ phonenumber: phonenumber }, id]);

    sql = `select phonenumber where id = ?`;
    let [result2] = await conn.query(sql, id);

    conn.release();
    return { data: result2[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Email Service
const updateEmailService = async (data, id) => {
  const { email } = data;

  let conn, sql;
  try {
    conn = await dbCon.promies().getConnection();

    sql = `select email from user where id = ?`;
    let [result] = await conn.query(sql, id);
    if (result[0].email == email) {
      throw "Email must be different!";
    }

    sql = `select id from user where email = ?`;
    let [result1] = await conn.query(sql, email);
    if (result1.length) {
      throw "Email has already been used";
    }

    sql = `update user set ? where id = ?`;
    await conn.query(sql, [{ email: email }, id]);

    sql = `select email where id = ?`;
    let [result2] = await conn.query(sql, id);

    conn.release();
    return { data: result2[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Gender Service
const updateGenderService = async (data, id) => {
  const { gender } = data;

  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `update user set ? where id = ?`;
    await conn.query(sql, [{ gender: gender }, id]);

    sql = `select gender from user where id = ?`;
    let [result] = await conn.query(sql, id);

    conn.release();
    return { data: result[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Birth Date Service
const updateBirthDateService = async (data, id) => {
  const { birth_date } = data;

  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `update user set ? where id = ?`;
    await conn.query(sql, [{ birth_date: birth_date }, id]);

    sql = `select birth_date from user where id = ?`;
    let [result] = await conn.query(sql, id);

    conn.release();
    return { data: result[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

module.exports = {
  updateFullnameService,
  updateBirthDateService,
  updateEmailService,
  updateGenderService,
  updatePhonenumberService,
  updateUsernameService,
};
