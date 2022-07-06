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
    return { data: result[0] };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Get Provinces Service
const getProvincesService = async () => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `select name, id from province`;
    let [provinces] = await conn.query(sql);

    conn.release();
    return { data: provinces };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Get Cities Service
const getCitiesService = async (province_id) => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `select name, id from city where province_id = ?`;
    let [cities] = await conn.query(sql, province_id);

    conn.release();
    return { data: cities };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Get User Address
const getAddressService = async (id) => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    sql = `select id, address, is_default, province_id, city_id, recipient_name, recipient_number, address_label from address where user_id = ? order by is_default asc`;
    let [userAddress] = await conn.query(sql, id);

    conn.release();
    return { data: userAddress };
  } catch (error) {
    console.log(error);
    conn.release();
    throw new Error(error.message || error);
  }
};

//Add address
const addAddressService = async (data, id) => {
  const {
    address,
    province_id,
    city_id,
    recipient_number,
    recipient_name,
    address_label,
  } = data;
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();

    // sql = `select address, province_id, city_id, recipient_number, recipient_name, address_label, is_default from address where user_id = ?`;
    // let [userAddress] = await conn.query(sql, id);

    sql = `select id from address where address = ? and province_id = ? and city_id = ?`;
    let [userAddress1] = await conn.query(sql, [address, province_id, city_id]);

    if (userAddress1.length) {
      throw "Please insert different address!";
    }

    // if (userAddress.length) {
    //   for (let i = 0; i < userAddress.length; i++) {
    //     const element = userAddress[i];
    //     if (
    //       element.address == address &&
    //       element.city_id == city_id &&
    //       element.province_id == province_id
    //     ) {
    //       throw "Please insert different address!";
    //     }
    //   }
    // }
    sql = `select address, province_id, city_id, recipient_number, recipient_name, address_label, is_default from address where user_id = ?`;
    let [userAddress] = await conn.query(sql, id);

    let insertData = {
      address: address,
      province_id: province_id,
      city_id: city_id,
      recipient_number: recipient_number,
      recipient_name: recipient_name,
      address_label: address_label,
      user_id: id,
      is_default: userAddress.length ? "NO" : "YES",
    };
    sql = `insert into address set ?`;
    await conn.query(sql, insertData);

    // if (userAddress.length == 1) {
    //   sql = `update address set ? where user_id = ?`;
    //   await conn.query(sql, [{ is_default: "YES" }, id]);

    //   sql = `select address, province_id, city_id, recipient_number, recipient_name, address_label, is_default from address where user_id = ?`;
    //   [userAddress] = await conn.query(sql, id);
    //   conn.commit();
    //   conn.release();
    //   return { data: userAddress };
    // }
    console.log(userAddress);
    await conn.commit();
    conn.release();
    return { data: userAddress };
  } catch (error) {
    console.log(error);
    await conn.rollback();
    conn.release;
    throw new Error(error.message || error);
  }
};

//Update Default Address
const updateDefaultAddressService = async (id, address_id) => {
  let conn, sql;
  try {
    conn = await dbCon.promise().getConnection();
    await conn.beginTransaction();

    sql = `select id from address where user_id = ? and is_default = "YES"`;
    let [defaultAddress] = await conn.query(sql, id);

    sql = `update address set ? where id = ?`;
    await conn.query(sql, [{ is_default: "NO" }, defaultAddress[0].id]);

    sql = `update address set ? where id = ?`;
    await conn.query(sql, [{ is_default: "YES" }, address_id]);

    sql = `select address, province_id, city_id, recipient_number, recipient_name, address_label, is_default from address where user_id = ? and is_default = "YES"`;
    let [defaultAddress1] = await conn.query(sql, id);

    await conn.commit();
    conn.release();
    return { data: defaultAddress1 };
  } catch (error) {
    console.log(error);
    await conn.rollback();
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
  getProvincesService,
  getCitiesService,
  addAddressService,
  updateDefaultAddressService,
  getAddressService,
};
