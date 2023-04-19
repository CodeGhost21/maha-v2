import { fetchTweetData } from "../utils/tweetData";
import { approveQuest } from "../reviewQuest";

export const checkTwitterMeme = async (
  tweetId: string,
  questId: string,
  questUserName: string
) => {
  console.log("checkTwitterMeme");

  const tweetData: any = await fetchTweetData(tweetId, questUserName);

  let questStatus = "fail";
  let comment = "";
  if (tweetData.success) {
    if (tweetData.entities.media && tweetData.entities.media.length > 0) {
      // console.log("media", tweetData.entities.media);
      questStatus = "success";
    } else if (tweetData.entities.urls.length > 0) {
      // console.log("url", tweetData.entities.urls);
      questStatus = "success";
    }
  } else {
    comment: "this tweet is too old";
  }

  // const approveResponse = await approveQuest(
  //   ["692f4117-b257-444d-8925-84f715dabd1b"],
  //   questStatus,
  //   comment
  // );
};
