var express = require("express");
var router = express.Router();
var users = require("./users");
var posts = require("./post");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");

passport.use(new localStrategy(users.authenticate()));

router.get("/", function (req, res) {
  res.render("index", { footer: false });
});

router.get("/login", function (req, res) {
  res.render("login", { footer: false });
});

router.get("/feed", isLoggedIn, async function (req, res) {
  const user = await users.findOne({ username: req.session.passport.user });
  const feedPosts = await posts.find().populate("user");
  res.render("feed", { footer: true, feedPosts, user });
});

router.get("/profile", isLoggedIn, async function (req, res) {
  const user = await users
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  res.render("profile", { footer: true, user });
});

router.get("/search", isLoggedIn, function (req, res) {
  res.render("search", { footer: true });
});
router.get("/like/post/:id", isLoggedIn, async function (req, res) {
  const user = await users.findOne({ username: req.session.passport.user });
  const post = await posts.findOne({ _id: req.params.id });

  if (post.likes.indexOf(user._id) === -1) {
    post.likes.push(user._id);
  } else {
    post.likes.splice(post.likes.indexOf(user._id), 1);
  }
  await post.save();
  res.redirect("/feed");
});

router.get("/edit", isLoggedIn, async function (req, res) {
  const user = await users.findOne({ username: req.session.passport.user });
  res.render("edit", { footer: true, user });
});

router.get("/upload", isLoggedIn, function (req, res) {
  res.render("upload", { footer: true });
});

router.post("/register", (req, res, next) => {
  const userData = new users({
    username: req.body.username,
    email: req.body.email,
    name: req.body.name,
  });

  users.register(userData, req.body.password).then(() => {
    passport.authenticate("local")(req, res, () => {
      res.redirect("/profile");
    });
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
  }),
  function (req, res) {}
);

router.get("/logout", function (req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.post("/update", upload.single("image"), async (req, res) => {
  const user = await users.findOneAndUpdate(
    { username: req.session.passport.user },
    {
      username: req.body.username,
      name: req.body.name,
      bio: req.body.bio,
    },
    { new: true }
  );
  if (req.file) {
    user.profileImage = req.file.filename;
  }
  await user.save();
  res.redirect("/profile");
});

router.post("/upload", isLoggedIn, upload.single("image"), async (req, res) => {
  const user = await users.findOne({ username: req.session.passport.user });
  const post = await posts.create({
    picture: req.file.filename,
    user: user._id,
    caption: req.body.caption,
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/feed");
});

router.get("/username/:username", isLoggedIn, async function (req, res) {
  const regex = new RegExp(`^${req.params.username}`, "i");
  const searchUsers = await users.find({ username: regex });
  res.json(searchUsers);
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
