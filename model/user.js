const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/project2");

const userModel = mongoose.Schema({
  userName: String,
  name: String,
  age: Number,
  email: String,
  password: String,
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "posts" }],
  image: {
    type: String,
    default: "uploads\\149071.png",
  },
});
module.exports = mongoose.model("user", userModel);
