const { dbCon } = require("./../connection");
const fs = require("fs");

//Fullname Service
const updateFullnameService = async (data, id) => {
  const { fullname } = data;

  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    if (fullname.length < 4) {
      throw "Please insert minimum 4 characters";
    }

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

    if (username.length < 1) {
      throw "Username can not be blank!";
    }

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
    conn = await dbCon.promise().getConnection();

    if (phonenumber.length < 1) {
      throw "Phonenumber can not be blank!";
    }

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

    sql = `select phonenumber from user where id = ?`;
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
    conn = await dbCon.promise().getConnection();

    if (email.length < 1) {
      throw "Email can not be blank!";
    }

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

    sql = `select email from user where id = ?`;
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

    if (gender == "pria") {
      sql = `update user set ? where id = ?`;
      await conn.query(sql, [{ gender: "pria" }, id]);
    } else {
      sql = `update user set ? where id = ?`;
      await conn.query(sql, [{ gender: "wanita" }, id]);
    }

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
  const { date_of_birth } = data;
  let birthDate = Date.parse(date_of_birth) / 1000;
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `update user set date_of_birth = date_add(from_unixtime(0), INTERVAL ? second) where id = ?`;
    await conn.query(sql, [birthDate, id]);

    sql = `select date_of_birth from user where id = ?`;
    let [result] = await conn.query(sql, id);
    console.log(result);
    conn.release();
    return { data: result[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Profile Picture Service
const updateProfilePictureService = async (profile_picture, id) => {
  let path = "/photos";
  // let {image} = req.files
  // simpan ke database '/books/book1648525218611.jpeg'
  const imagePath = profile_picture
    ? `${path}/${profile_picture.filename}`
    : null;
  console.log(profile_picture, "ini profpic");

  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `select profile_picture from user where id = ?`;
    let [result0] = await conn.query(sql, id);
    console.log(result0, "ini profpic sebelum");
    console.log(result0.length, "ini length");

    if (imagePath) {
      if (result0[0].profile_picture) {
        fs.unlinkSync("./public" + result0[0].profile_picture);
      }
    }

    sql = `update user set ? where id = ?`;
    let updateData = {
      profile_picture: imagePath,
    };
    await conn.query(sql, [updateData, id]);

    sql = `select profile_picture from user where id = ?`;
    let [result] = await conn.query(sql, id);
    console.log(result, "ini profPic after");
    conn.release();
    return { data: result[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Delete profile picture
const deleteProfilePictureService = async (imagePath, id) => {
  let conn, sql;
  try {
    conn = dbCon.promise();

    sql = `select profile_picture from user where id = ?`;
    let [result0] = await conn.query(sql, id);
    fs.unlinkSync("./public" + result0[0].profile_picture);

    sql = `update user set ? where id = ?`;
    let updateData = {
      profile_picture: imagePath,
    };
    await conn.query(sql, [updateData, id]);

    sql = `select profile_picture from user where id = ?`;
    let [result] = await conn.query(sql, id);
    return { data: result[0] };
  } catch (error) {
    console.log(error);
    throw new Error(error.message || error);
  }
};

//Get Updated Data Service
const getUpdatedUserprofileDataService = async (id) => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `select id, username, fullname, date_of_birth, profile_picture, gender, phonenumber, email from user where id = ?`;
    let [result] = await conn.query(sql, id);
    conn.release();
    return { data: result };
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
  updateProfilePictureService,
  deleteProfilePictureService,
  getUpdatedUserprofileDataService,
};
