import { fetchTweetData } from "../../utils/tweetData";
import { Quest } from "../../database/models/quest";
import { approveQuest } from "../reviewQuest";
import { saveZelayUser } from "../user";

export const checkTweetMAHA = async (
  tweetId: string,
  questUserName: string,
  quest: any
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
    "#mahalend",
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
        await Quest.create({
          questId: quest.id,
          tweetId: tweetId,
          tweetDate: tweetData.tweetDate,
          questDetails: quest,
        });

        //save zelay user if doesn't exists
        await saveZelayUser(quest.user.id, quest.user.name);
        break;
      }
      comment = "this tweet is missing maha tag";
    }
  } else {
    comment = tweetData.comment;
  }
  if (questStatus === "success") {
    await approveQuest([quest.id], questStatus, comment);
  }
};
