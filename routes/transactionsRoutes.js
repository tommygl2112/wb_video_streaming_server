const controller = require("../controllers/transactionsController");
const express = require("express");

const api = express.Router();

api.post("/transactions", controller.post);

module.exports = api;