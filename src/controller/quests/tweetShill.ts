import nconf from "nconf";

import { fetchTweetData } from "../utils/tweetData";
import { approveQuest } from "../reviewQuest";
import { sendRequest } from "../utils/sendRequest";

export const checkShillMaha = async (
  tweetId: string,
  questId: string,
  questUserName: string
) => {
  const tweetData: any = await fetchTweetData(tweetId, questUserName);

  let questStatus = "fail";
  let comment = "";

  if (tweetData.success) {
    const response = await checkTwitterUserFollowers(
      tweetData.tweet.in_reply_to_screen_name
    );
    questStatus = response ? "success" : "fail";
  } else {
    console.log("else", tweetData);
    comment = tweetData.comment;
  }
  const response = await approveQuest([questId], questStatus, comment);
  console.log(response);
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
