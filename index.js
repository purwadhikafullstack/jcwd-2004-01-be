require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT;
const cors = require("cors");
const { dbCon } = require("./src/connection");

//CORS
app.use(cors({
    exposedHeaders: ["x-total-count", "x-token-access"]
}));

//JSON
app.use(express.json());

//PARSING INCOMING REQUEST
app.use(express.urlencoded({ extended : false }));

app.use(express.static("public"));

//GET
app.get("/", (req, res) => {
    res.send("<h1>Healthymed API ready</h1>")
});

// Auth Routes
const { authenticationRoutes } = require("./src/routes");
app.use("/auth", authenticationRoutes);

//LISTEN
app.listen(PORT, () => console.log(`App running on PORT ${PORT}`))