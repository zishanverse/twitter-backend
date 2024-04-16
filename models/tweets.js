const mongoose = require("mongoose");

const TweetsSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    require: true,
  },
  name: {
    type: String,
    require: true,
  },
  gender: {
    type: String,
    require: true,
  },
});

const Tweets = mongoose.model("tweets", TweetsSchema);

module.exports = Tweets;
