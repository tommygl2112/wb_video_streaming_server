const mongoose = require("mongoose");

const adminSchema = mongoose.Schema({
  user: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("Admin", adminSchema);