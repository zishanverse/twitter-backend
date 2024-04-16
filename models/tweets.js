const mongoose = require("mongoose");

const TweetsSchema = mongoose.Schema({
    tweet_id: {
    type: Number,
    required: true,
  },
  tweet: {
    type: String,
    require: true,
  },
  user_id: {
    type: Number,
    require: true,
  },
  date_time: {
    type: String,
    require: true,
  },
});

const Tweets = mongoose.model("tweets", TweetsSchema);

module.exports = Tweets;