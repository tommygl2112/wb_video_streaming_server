const controller = require("../controllers/adminController");
const express = require("express");
const multiparty = require("connect-multiparty");

const api = express.Router();

const md_upload = multiparty({uploadDir: "./assets/videos"});

api.post("/admin/register", controller.createAdmin);
api.post("/admin/login", controller.login);
api.post("/admin/rgg/upload", [md_upload], controller.uploadNewVideo);
api.post("/admin/token/decode", controller.logedUser);
api.patch("/admin/video/edit", [md_upload], controller.editVideo);
api.delete("/admin/video/delete", controller.deleteVideo);

api.post("/admin/test", [md_upload], controller.uploadTest);

module.exports = api;