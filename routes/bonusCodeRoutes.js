const controller = require("../controllers/bonusCodeController");
const multiParty = require("connect-multiparty");
const express = require("express");

const api = express.Router();
md_upload = multiParty({ uploadDir: "assets/bonuscode" });

api.post("/bonusCode/add", [md_upload], controller.addBonusCode);
api.get("/bonusCode/all", controller.getAllBonusCodes);
api.post("/bonusCode/verifyBonusCode", controller.verifyBonusCode);

module.exports = api;
