const multer = require("multer");
const fs = require("fs");

const upload = (destination, fileNamePrefix) => {
  // default path adalah folder public
  const defaultPath = "./public";
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      console.log("line 9 isi file : ", file);
      const dir = defaultPath + destination;
      if (fs.existsSync(dir)) {
        // ngecek apakah directory sudah ada atau belum
        console.log(dir, "exist");
        cb(null, dir);
      } else {
        // jika dir tidak ditemukan maka buat folder
        fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
        console.log(dir, "make");
      }
    },
    filename: function (req, file, cb) {
      let originalName = file.originalname; // isinya adalah nama file yang dikirim dari user
      let ext = originalName.split("."); // nama file 'dino.png' -> [dino,png]
      let filename = fileNamePrefix + Date.now() + "." + ext[ext.length - 1]; // ext[ext.length - 1] = png
      cb(null, filename);
    },
  });

  const fileFilter = (req, file, cb) => {
    // tambahkan extention yang mau di upload jika tidak ada disini
    const ext = /\.(jpg|jpeg|png|PNG|webp|JPEG|JPG)$/; //regex
    if (!file.originalname.match(ext)) {
      return cb(new Error("Only selected file type are allowed"), false);
    }
    cb(null, true);
  };

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 2 * 1024 * 1024, //2mb
    },
  });
};

module.exports = upload;
