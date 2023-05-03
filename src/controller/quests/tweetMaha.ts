import { fetchTweetData } from "../utils/tweetData";
import { approveQuest } from "../reviewQuest";
// import { userBonus } from "../zealyBot";

export const checkTweetMAHA = async (
  tweetId: string,
  questId: string,
  questUserName: string
) => {
  const mahaTypes = [
    "MAHA",
    "MahaDAO",
    "$MAHA",
    "$ARTH",
    "ARTH",
    "#MAHA",
    "#ARTH",
    "@MahaDAO",
    "#MahaDAO",
    "@TheMahaDAO",
    "@mahalend",
  ].map((t) => t.toLowerCase());
  const tweetData: any = await fetchTweetData(tweetId, questUserName);
  let questStatus = "fail";
  let comment = "";
  if (tweetData.success) {
    for (let i = 0; i < mahaTypes.length; i++) {
      const words: string[] = tweetData.tweet.full_text
        .toLowerCase()
        .replace(/[.,\n?]/g, " ")
        .split(" ");

      const isValid = words.findIndex((word) => mahaTypes.includes(word)) >= 0;

      if (isValid) {
        questStatus = "success";
        break;
      }
      comment = "this tweet is missing maha tag";
    }
  } else {
    comment = tweetData.comment;
  }
  if (questStatus === "success") {
    await approveQuest([questId], questStatus, comment);
  }
};
