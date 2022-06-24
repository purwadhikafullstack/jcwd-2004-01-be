const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER_NAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: 3306,
  connectionLimit: 10,
});

db.getConnection((err, conn) => {
  if (err) {
    console.error("Could not establish connection");
  }
  console.log(`Connected as id ${conn.threadId}`);
});

module.exports = db;
