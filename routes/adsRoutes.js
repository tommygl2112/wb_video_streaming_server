const controller = require("../controllers/adsController");
const express = require("express");
const multiParty = require("connect-multiparty");

const api = express.Router();
md_upload = multiParty({uploadDir: "assets/"});

api.post("/ads/add", [md_upload], controller.addAd);
api.post("/ads/fetch", controller.fetchAds);
api.post("/ads/ad", controller.fetchSingleAd);
api.patch("/ads/view", controller.updateView);

module.exports = api;