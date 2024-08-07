const express = require("express");
const app = express();
const userModel = require("./model/user");
const postModel = require("./model/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const path = require("path");
var jwt = require("jsonwebtoken");
const user = require("./model/user");

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const upload = require("./config/multerconfig");

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/profile", IsLogedIn, async (req, res) => {
  try {
    let userProfile = await userModel
      .findOne({ _id: req.user.id })
      .populate("posts");
    if (!userProfile) {
      return res.status(404).send("User not found");
    }
    res.render("profile", { user: userProfile});
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).send("Server error");
  }
});


app.get("/feed", IsLogedIn, async (req, res) => {
  try {
    let allPosts = await postModel.find({}).lean(); // Fetch all posts and convert them to plain JavaScript objects

    await Promise.all(
      allPosts.map(async (post) => {
        let user = await userModel.findOne({ _id: post.user });
        post.userName = user.userName; // Add the userName to the post
        post.isLikedByCurrentUser = post.liked.some(
          (id) => id.toString() === req.user.id
        );
      })
    );
    console.log("allPosts :>> ", allPosts);
    console.log("type of allPosts[0] :>> ", typeof allPosts[0]);
    res.render("feed", { posts: allPosts, userId: req.user.id }); // Pass the posts array to the template
  } catch (err) {
    res.status(500).send("Error fetching posts");
  }
});

app.get("/edit/:id", async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id });
  res.render("edit", { post });
});


app.get("/like/:id", IsLogedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  if (post.liked.indexOf(req.user.id) === -1) {
    post.liked.push(req.user.id);
  } else {
    post.liked.splice(post.liked.indexOf(req.user.id), 1);
  }
  await post.save();
  res.redirect("/profile");
});
app.get("/feed-like/:id", IsLogedIn, async (req, res) => {
  console.log("feed like page excuted");
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  if (post.liked.indexOf(req.user.id) === -1) {
    post.liked.push(req.user.id);
    console.log("liked");
  } else {
    post.liked.splice(post.liked.indexOf(req.user.id), 1);
    console.log("disliked");
  }
  await post.save();
  res.redirect("/feed");
});

app.get("/logout", (req, res) => {
  res.cookie("token", "", { expires: new Date(0) });
  res.redirect("/login");
});

app.post("/create-post", IsLogedIn, async (req, res) => {
  let user = await userModel.findOne({ _id: req.user.id });
  let post = await postModel.create({
    user: user._id,
    content: req.body.content,
  });
  user.posts.push(post._id);
  await user.save();
  console.log("user :>> ", user);
  res.redirect("/profile");
});
app.post("/update/:id", IsLogedIn, async (req, res) => {
  let post = await postModel.findOneAndUpdate(
    { _id: req.params.id },
    {
      content: req.body.content,
    }
  );
  console.log("user :>> ", user);
  res.redirect("/profile");
});

app.post(
  "/image-upload",
  IsLogedIn,
  upload.single("image"),
  async (req, res) => {
    let user = await userModel.findOne({ _id: req.user.id });
    user.image = req.file.path;
    await user.save();
    console.log("req.file :>> ", req.file);
    res.redirect("profile");
  }
);

app.post("/create", (req, res) => {
  const { name, email, age, pswd } = req.body;
  console.log("name :>> ", name);
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(pswd, salt, async (err, hash) => {
      let user = await userModel.create({
        userName: name,
        email,
        age,
        password: hash,
      });
      var token = jwt.sign({ email, id: user._id }, "shhhhhhh");
      res.cookie("token", token, { httpOnly: true });
      res.redirect("/profile");
    });
  });
});

app.post("/login", async (req, res) => {
  const { email, pswd } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) {
    return res.status(500).send("Something went wrong!");
  }
  bcrypt.compare(pswd, user.password, (err, result) => {
    if (!result) {
      return res.status(500).send("Something went wrong!");
    }
    var token = jwt.sign({ email, id: user._id }, "shhhhhhh");
    res.cookie("token", token, { httpOnly: true });
    console.log("login token :>> ", token);
    res.status(200).redirect("/profile");
  });
});

function IsLogedIn(req, res, next) {
  console.log("Is logged in req.cookies.token :>> ", req.cookies.token);
  if (!req.cookies.token) {
    return res.redirect("/login");
  }
  try {
    let data = jwt.verify(req.cookies.token, "shhhhhhh");
    req.user = data;
    next();
  } catch (err) {
    return res.send("You have to login first");
  }
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
