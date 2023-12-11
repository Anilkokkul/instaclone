const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/instaclone");

const postSchema = mongoose.Schema({
  picture: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  caption: String,
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  ],
  profileImage: String,
  bio: String,
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
});

module.exports = mongoose.model("post", postSchema);
