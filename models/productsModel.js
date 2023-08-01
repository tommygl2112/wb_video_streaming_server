const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  images: {
    type: [String],
    requred: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  categories: {
    type: [String],
    required: false,
  },
});

module.exports = mongoose.model("Product", productSchema);
