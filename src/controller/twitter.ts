import TwitterApiV2 from "twitter-api-v2";
import nconf from "nconf";
import Twit from "twit";

export const twitterMentions = async () => {
  const trackWords = ["$MAHA", "@TheMahaDAO", "$ARTH"];

  const twitterConfig = {
    apiKey: "YOUR_API_KEY",
    apiSecretKey: "YOUR_API_SECRET_KEY",
    accessToken: "YOUR_ACCESS_TOKEN",
    accessTokenSecret: "YOUR_ACCESS_TOKEN_SECRET",
  };

  // const twitterApiV2 = new TwitterApiV2(twitterConfig);

  //   const clientv1 = new Twit({
  //     consumer_key: nconf.get("TWITTER_CONSUMER_KEY"),
  //     consumer_secret: nconf.get("TWITTER_CONSUMER_SECRET"),
  //     access_token: nconf.get("TWITTER_ACCESS_TOKEN"),
  //     access_token_secret: nconf.get("TWITTER_ACCESS_TOKEN_SECRET"),
  //   });

  //   const stream = clientv1.stream("statuses/filter", { track: "#MAHA" });

  //   await stream.on("tweet", (tweet) => {
  //     console.log(tweet);
  //   });

  //   //   const channelScreenName = "CHANNEL_SCREEN_NAME";
  //   const streamFilter = clientv1.stream("statuses/filter", {
  //     track: trackWords,
  //     tweet_mode: "full_text",
  //   });

  //   streamFilter.on("tweet", (tweet) => {
  //     console.log(`New tweet from ${tweet.user.screen_name}: ${tweet.text}`);
  //   });

  //   streamFilter.on("error", (error) => {
  //     console.error("Error:", error);
  //   });
};
