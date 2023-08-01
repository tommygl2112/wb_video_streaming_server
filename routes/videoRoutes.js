const express = require("express");
const controller = require("../controllers/videoController");
const multiParty = require("connect-multiparty");

const api = express.Router();

md_upload = multiParty({ uploadDir: "public/RGG" });

api.post("/video/videoCollection", controller.videoCollection);

api.post("/video/total", controller.videoCount);

api.post("/video/videosById", controller.videosById);

api.post("/video/videosByCategory", controller.videosByCategory);

api.post("/video/videosByModel", controller.videosByModel);

api.post("/video/countModelVideos", controller.countModelVideos);

api.post("/video/videosBySearch", controller.videosBySearch);

api.post("/video/videosByDate", controller.videosByDate);

api.post("/video/videosByViews", controller.videosByViews);

api.post("/videos/viewsModel", controller.viewsPerModel);

api.post("/video/videosByLikes", controller.videosByLikes);

api.post("/video/videosByQuality", controller.videosByQuality);

api.patch("/video/like", controller.like);

api.patch("/video/dislike", controller.dislike);

api.patch("/video/view", controller.view);

api.post("/video/buyVideo", controller.buyVideo);

api.post("/video/watchAd", controller.watchAd);

api.post("/video/search", controller.search);

api.post("/video/private", controller.videosPrivate);

module.exports = api;
