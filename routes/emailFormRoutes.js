const express = require("express");
const controller = require("../controllers/emailFormController");
const multiparty = require("connect-multiparty");

const api = express.Router();

const md_upload = multiparty({ uploadDir: "./assets/apply_form" });

api.post("/form", [md_upload], controller.handler);
api.get("/test", controller.test);

api.get("/delete", [md_upload], controller.deleteSendedImages);

module.exports = api;