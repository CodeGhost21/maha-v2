import nconf from "nconf";

import { fetchTweetData } from "../utils/tweetData";
import { approveQuest } from "../reviewQuest";
import { sendRequest } from "../utils/sendRequest";
import { Quest } from "../../database/model/quest";
import { userBonus } from "../zealyBot";

export const checkShillMaha = async (
  tweetId: string,
  questId: string,
  questUserName: string,
  questUserId: string
) => {
  console.log(tweetId, questId, questUserName, questUserId);
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
      if (response) {
        await Quest.create({
          questId: questId,
          tweetId: tweetId,
          tweetDate: tweetData.tweetDate,
          influencerName: tweetData.tweet.in_reply_to_screen_name,
          questUserId: questUserId,
        });
      }
    }
  } else {
    comment = tweetData.comment;
  }
  if (questStatus === "success") {
    await approveQuest([questId], questStatus, comment);
  }
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

export const checkInfluencerLike = async () => {
  const allquest = await Quest.find({
    tweetDate: { $gt: new Date(Date.now() - 86400000 * 2) },
    influencerLiked: false,
  });
  if (allquest.length > 0) {
    allquest.map(async (quest: any) => {
      const uri = `https://api.twitter.com/2/tweets/${quest.tweetId}/liking_users`;
      const header = {
        Authorization: `Bearer ${nconf.get("TWITTER_TOKEN")}`,
      };
      const response: any = await sendRequest("get", uri, header);
      const parseResponse = JSON.parse(response);
      const screenName: string[] = await parseResponse.data.map(
        (user: any) => user.username
      );
      if (screenName.includes(quest.influencerName)) {
        quest.influencerLiked = true;
        await quest.save();
        //give extra points if the tweet is liked by influencer
        await userBonus(quest.questUserId, 100, "tweet liked by influencer");
        // return true;
      }
    });
  }
};
