import { sendRequest } from "./sendRequest";
import nconf from "nconf";

export const fetchTweetData = async (
  tweetId: string,
  questUserName: string
) => {
  try {
    const url = `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}&tweet_mode=extended`;

    const header = {
      Authorization: `Bearer ${nconf.get("TWITTER_TOKEN")}`,
    };
    const tweetData: any = await sendRequest("get", url, header);
    const parseTweetData = JSON.parse(tweetData);

    if (await verifyTweet(questUserName, parseTweetData.user.screen_name)) {
      if (
        new Date(parseTweetData.created_at).getTime() >
        new Date().getTime() - 86400000
      ) {
        return {
          success: true,
          tweet: parseTweetData,
          tweetDate: parseTweetData.created_at,
        };
      }
      return { success: false, comment: "this tweet is too old" };
    }
    return { success: false, comment: "not a valid tweet" };
  } catch (e) {
    console.log(e);
    return { success: false, comment: "no tweet" };
  }
};

export const verifyTweet = async (
  questUserName: string,
  twitterScreenName: string
) => {
  if (questUserName === twitterScreenName) return true;
  else return false;
};
