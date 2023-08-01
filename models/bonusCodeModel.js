const mongoose = require("mongoose");

const BonusCodeSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    require: true,
  },
  expirationDate: {
    type: Date,
    require: true,
  },
  miniature: {
    type: String,
    require: false,
  },
});

module.exports = mongoose.model("bonusCode", BonusCodeSchema);
