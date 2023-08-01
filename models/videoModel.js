const mongoose = require("mongoose");
const videoSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  serverLinkMiniature: {
    type: String,
    required: true,
  },
  linkPreview: {
    type: String,
    required: true,
  },
  linkShort: {
    type: String,
    required: true,
  },
  linkFull: {
    type: String,
    required: true,
  },
  publishingDate: {
    type: Date,
    required: true,
  },
  categories: [
    {
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
    },
  ],
  models: [
    {
      model: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Model",
        required: false
      },
    },
  ],
  quality: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  views: {
    type: Number,
    required: true,
  },
  likes: {
    type: Number,
    required: true,
  },
  dislikes: {
    type: Number,
    required: true,
  },
  publisher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: false,
  },
  price: {
    type: Number,
    required: false,
  },
  website: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  compressed360: {
    type: String,
    require: false
  },
  compressed480: {
    type: String,
    require: false
  },
  compressed720: {
    type: String,
    require: false
  },
  launchDate:{
    type: Date,
    require: false
  }
});

module.exports = mongoose.model("Video", videoSchema);
