const inputProductController = async (req, res) => {
  let conn, sql;
  let jalur = "/image";
  const { id } = req.user;

  console.log("ini req.files", req.files);
  console.log("ini req.body", req.body);
  const {
    name,
    original_price,
    price,
    unit,
    expired_at,
    no_bpom,
    no_obat,
    indication,
    composition,
    packaging,
    med_classification,
    need_receipt,
    storage_method,
    principal,
    nomor_ijin_edar,
    warning,
    usage,
  } = req.body;
  const { image } = req.files;
  console.log("image", image);
  console.log("caption", caption);

  const imagearrpath = image
    ? image.map((val) => {
        return `${jalur}/${val.filename}`;
      })
    : [];

  console.log("ini imagearrpath", imagearrpath);

  try {
    conn = await dbCon.promise().getConnection();

    await conn.beginTransaction();
    if (!image) {
      throw { message: "Must upload at least one image!" };
    }
    // insert into product table
    sql = `INSERT INTO product SET ?`;
    let dataTable = {
      name,
      original_price,
      price,
      unit,
      expired_at,
      no_bpom,
      no_obat,
    };
    let [result] = await conn.query(sql, dataTable);
    console.log(result.insertId);

    let product_id = result.insertId;
    // console.log("posts_id", posts_id);

    // insert into  posts_images
    sql = `INSERT INTO posts_images set ?`;

    for (let i = 0; i < imagearrpath.length; i++) {
      let insertDataImage = {
        image: imagearrpath[i],
        product_id,
      };
      await conn.query(sql, insertDataImage);
    }

    //insert data to description table
    sql = `INSERT INTO description set ?`;

    let dataDescription = {
      indication,
      composition,
      packaging,
      med_classification,
      need_receipt,
      storage_method,
      principal,
      nomor_ijin_edar,
      warning,
      usage,
      product_id,
    };

    await conn.query(sql, dataDescription);

    sql = ``;

    await conn.commit();
    return res.status(200).send({ message: "berhasil di upload" });
  } catch (error) {
    console.log(error);
    conn.rollback();
    if (imagearrpath) {
      // klo foto sudah terupload dan sql ggaal maka fotonya dihapus
      for (let i = 0; i < imagearrpath.length; i++) {
        fs.unlinkSync("./public" + imagearrpath[i]);
      }
    }
    return res.status(500).send({ message: error.message || error });
  } finally {
    conn.release();
  }
};

module.exports = {
  inputProductController,
};
