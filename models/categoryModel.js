const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  miniature:{
    type: String,
    require: false,
  },
});

module.exports = mongoose.model("Category", categorySchema);