const express = require("express");
const controller = require("../controllers/categoryController");
const multiParty = require("connect-multiparty");

const api = express.Router();

md_upload = multiParty({uploadDir: "assets/categories"});

api.get("/categoryCollection", controller.categoryCollection);

api.post("/uploadCategory", [md_upload], controller.uploadCategory);

module.exports = api;
