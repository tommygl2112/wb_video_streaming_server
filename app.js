const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { API_VERSION } = require("./constants");

const app = express();

//configure Header HTTP - CORS
app.use(cors());

//import routings

const userRoutes = require("./routes/userRoutes");
const videoRoutes = require("./routes/videoRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const modelRoutes = require("./routes/modelRoutes");
const emailFormRoutes = require("./routes/emailFormRoutes");
const api = require("./routes/userRoutes");
const adsRoutes = require("./routes/adsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const bonusCodeRoutes = require("./routes/bonusCodeRoutes");
const transactionsRoutes = require("./routes/transactionsRoutes");

//configure body parse
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//configure static folder
app.use(express.static("assets"));

//configure routtings
app.use(`/api/${API_VERSION}`, userRoutes);
app.use(`/api/${API_VERSION}`, videoRoutes);
app.use(`/api/${API_VERSION}`, categoryRoutes);
app.use(`/api/${API_VERSION}`, modelRoutes);
app.use(`/api/${API_VERSION}`, emailFormRoutes);
app.use(`/api/${API_VERSION}`, adsRoutes);
app.use(`/api/${API_VERSION}`, adminRoutes);
app.use(`/api/${API_VERSION}`, bonusCodeRoutes);
app.use(`/api/${API_VERSION}`, transactionsRoutes);

module.exports = app;
