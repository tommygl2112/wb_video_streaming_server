const express = require("express");
const controller = require("../controllers/modelController");
const multiParty = require("connect-multiparty");

const api = express.Router();

md_upload = multiParty({uploadDir: "assets/actors"});


api.get("/modelCollection/total", controller.getTotalModels);

api.get("/modelCollection/all", controller.getAllModels);

api.post("/modelCollection", controller.modelCollection);

api.post("/model/modelById", controller.findModel);

api.post("/uploadModel", [md_upload], controller.upluadModel);

api.patch("/model/editModel", [md_upload], controller.editModel);

api.delete("/model/delete", controller.deleteModel);




module.exports = api;