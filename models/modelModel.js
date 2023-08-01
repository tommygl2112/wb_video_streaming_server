const mongoose = require("mongoose");

const modelSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  miniature: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    require: true,
  },
  background: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Model", modelSchema);
