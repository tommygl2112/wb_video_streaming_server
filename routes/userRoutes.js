const express = require("express");
const controller = require("../controllers/userController");
const multiparty = require("connect-multiparty");

const api = express.Router();

const md_upload = multiparty({uploadDir: "./assets/profile_picture"});

api.get("/test", controller.test);

//get all users
api.get("/userCollection/all", controller.getAllUsers);
//get total users
api.get("/userCollection/total", controller.getTotalUsers);
//register
api.post("/user/register", controller.register);
//verify email
api.get("/user/verify/:token", controller.verifyEmail);
//login
api.post("/user/login", controller.login);
//credits
api.post("/user/update/credits", controller.updateUserCredits);
//decode token
api.post("/user/token/decode", controller.logedUser);
//profile picture
api.post("/user/profile/picture", [md_upload], controller.uploadProfilePicture);
//premium
api.patch("/user/update/premium", controller.updatePremium);
//resent verification email
api.post("/user/email/resent", controller.resentVerificationEmail);
// Add videos to check later section
api.put("/user/addVideo", controller.addCheckLaterVideos);
// Remove videos from check later section
api.put("/user/removeVideo", controller.removeCheckLaterVideos);
// List videos from check later section
api.post("/user/listVideos", controller.listCheckLaterVideos);

module.exports = api;
