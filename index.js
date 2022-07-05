require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT;
const morgan = require("morgan");
const cors = require("cors");
const { dbCon } = require("./src/connection");
const multer = require("multer");

morgan.token("date", function (req, res) {
  return new Date().toString();
});
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :date")
);

//CORS
app.use(
  cors({
    exposedHeaders: ["x-total-count", "x-token-access", "x-total-product"],
  })
);

//JSON
app.use(express.json());

//PARSING INCOMING REQUEST
app.use(express.urlencoded({ extended: false }));

app.use(express.static("public"));

//GET
app.get("/", (req, res) => {
  res.send("<h1>Healthymed API ready</h1>");
});

// Auth Routes
const { authenticationRoutes, productRoutes } = require("./src/routes");
app.use("/auth", authenticationRoutes);
app.use("/product", productRoutes);

//Userprofile Routes
const { userprofileRoutes } = require("./src/routes");
app.use("/profile", userprofileRoutes);

// Transaction Routes
const { transactionRoutes } = require("./src/routes");
app.use("/transaction", transactionRoutes);

//LISTEN
app.listen(PORT, () => console.log(`App running on PORT ${PORT}`));
