import { sendRequest } from "./sendRequest";
import nconf from "nconf";
import { twitterRequest } from "./twitterRequest";

export const fetchTweetData = async (url: string, questUserName: string) => {
  try {
    const tweetData = await twitterRequest("get", url);
    if (await verifyTweet(questUserName, tweetData.user.screen_name)) {
      if (
        true
        // new Date(parseTweetData.created_at).getTime() >
        // new Date().getTime() - 86400000
      ) {
        return {
          success: true,
          tweet: tweetData,
          tweetDate: tweetData.created_at,
        };
      }
      return { success: false, comment: "this tweet is too old" };
    }
    return { success: false, comment: "not a valid tweet" };
  } catch (e: any) {
    if (e && e.statusCode === 429) {
      console.log(e.statusCode);
      throw new Error("rate limit exceeded");
    }
    return { success: false, comment: "no tweet" };
  }
};

export const verifyTweet = async (
  questUserName: string,
  twitterScreenName: string
) => {
  if (questUserName.toLowerCase() === twitterScreenName.toLowerCase())
    return true;
  else return false;
};
