const mongoose = require("mongoose");

const postModel = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  content: String,
  liked: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  date: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("posts", postModel);
