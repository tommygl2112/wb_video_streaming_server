const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
  },
  birthday: {
    type: Date,
    require: true,
  },
  premium: {
    type: {
      isPremium: {
        type: Boolean,
      },
      expirationDate: {
        type: Date,
      },
    },
    require: true,
  },
  createdDay: {
    type: Date,
    require: true,
  },
  likes: {
    type: Array,
    require: false,
  },
  dislikes: {
    type: Array,
    require: false,
  },
  verified: {
    type: Boolean,
    require: true,
  },
  credits: {
    type: Number,
    require: true,
  },
  videos: [
    {
      video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: false,
      },
      expiration: {
        type: Date,
        required: false,
      },
    },
  ],
  ads: [
    {
      ad: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Adds",
        required: false,
      },
      expiration: {
        type: Date,
        required: false,
      },
    },
  ],
  picture: {
    type: String,
  },
  bonusCode: {
    type: [String],
    default: [],
  },
  checkLaterVideos: {
    type: [String],
    default: [],
    required: false,
  },
   website: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("User", userSchema);
