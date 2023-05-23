import Bluebird from "bluebird";
import { fetchTweetData, getTweet } from "../../utils/tweetData";
import { approveQuest } from "../reviewQuest";
import { Quest } from "../../database/models/quest";
import { userBonus } from "../zealyBot";
import { saveZelayUser } from "../user";

export const checkShillMaha = async (
  tweetId: string,
  questUserName: string,
  quest: any
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
      if (response) {
        await Quest.create({
          questId: quest.id,
          tweetId: tweetId,
          tweetDate: tweetData.tweetDate,
          influencerName: tweetData.tweet.in_reply_to_screen_name,
          questDetails: quest,
        });

        await saveZelayUser(quest.user.id, quest.user.name);
      }
    }
  } else {
    comment = tweetData.comment;
  }
  if (questStatus === "success") {
    await approveQuest([quest.id], questStatus, comment);
  }
};

const checkTwitterUserFollowers = async (screenName: string) => {
  const userFollower = await getTweet(
    `https://api.twitter.com/2/users/by/username/${screenName}?user.fields=public_metrics`
  );
  if (userFollower.data.public_metrics.followers_count >= 10000) return true;
  else return false;
};

export const checkInfluencerLike = async () => {
  const allQuest = await Quest.find({
    tweetDate: { $gt: new Date(Date.now() - 86400000 * 2) },
    influencerLiked: false,
  });
  if (allQuest.length > 0) {
    await Bluebird.mapSeries(allQuest, async (quest: any) => {
      try {
        const tweetLikes = await getTweet(
          `https://api.twitter.com/2/tweets/${quest.tweetId}/liking_users`
        );
        const screenName: string[] = await tweetLikes.data.map(
          (user: any) => user.username
        );
        if (screenName.includes(quest.influencerName)) {
          quest.influencerLiked = true;
          await quest.save();
          //if influencer liked the tweet assign 10 xp
          await userBonus(
            quest.questUserId,
            10,
            "tweet liked by influencer",
            "Rewards"
          );
          // return true;
        }
      } catch (e: any) {
        if (e && e.statusCode === 429) {
          console.log(e.statusCode);
          throw new Error("rate limit exceeded");
        }
      }
    });
  }
};

export const checkRetweet = async () => {
  const allQuest = await Quest.find({
    tweetDate: { $gt: new Date(Date.now() - 86400000 * 2) },
    influencerRetweet: false,
  });
  if (allQuest.length > 0) {
    await Bluebird.mapSeries(allQuest, async (quest: any) => {
      const retweetData = await getTweet(
        `https://api.twitter.com/1.1/statuses/retweets/${quest.tweetId}.json`
      );
      const userIds = retweetData.map(
        (retweet: any) => retweet.user.screen_name
      );
      if (userIds.includes(quest.influencerName)) {
        quest.influencerRetweet = true;
        await quest.save();
        //if influencer retweeted the tweet assign 100 xp
        await userBonus(
          quest.questUserId,
          100,
          "Tweet retweeted by influencer",
          "Rewards"
        );
      }
    });
  }
};
