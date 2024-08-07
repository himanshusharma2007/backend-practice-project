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
    default: "uploads\\fc2afca88c9bee50dd4fcdb8.png",
  },
});
module.exports = mongoose.model("user", userModel);
