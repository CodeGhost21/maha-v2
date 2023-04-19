import nconf from "nconf";

import { fetchTweetData } from "../utils/tweetData";
import { approveQuest } from "../reviewQuest";
import { sendRequest } from "../utils/sendRequest";

export const checkShillMaha = async (
  tweetId: string,
  questId: string,
  questUserName: string
) => {
  let questStatus = "fail";
  let comment = "";

  const tweetData: any = await fetchTweetData(tweetId, questUserName);

  if (tweetData.success) {
    if (tweetData.tweet.in_reply_to_screen_name === null) {
      questStatus = "fail";
      comment = "not a valid Influencer";
    } else {
      const response = await checkTwitterUserFollowers(
        tweetData.tweet.in_reply_to_screen_name
      );
      questStatus = response ? "success" : "fail";
    }
  } else {
    comment = tweetData.comment;
  }
  await approveQuest([questId], questStatus, comment);
};

const checkTwitterUserFollowers = async (screenName: string) => {
  const url = `https://api.twitter.com/2/users/by/username/${screenName}?user.fields=public_metrics`;
  const header = {
    Authorization: `Bearer ${nconf.get("TWITTER_TOKEN")}`,
  };
  const userResponse: any = await sendRequest("get", url, header);
  const parseUserResponse = JSON.parse(userResponse);
  if (parseUserResponse.data.public_metrics.followers_count >= 5000)
    return true;
  else return false;
};
