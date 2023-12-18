import { fetchTweetData } from "../../utils/tweetData";

export const checkTwitterMeme = async (
  tweetId: string,
  questId: string,
  questUserName: string
) => {
  console.log("checkTwitterMeme");

  const tweetData: any = await fetchTweetData(tweetId, questUserName);

  if (tweetData.success) {
    if (tweetData.entities.media && tweetData.entities.media.length > 0) {
      // console.log("media", tweetData.entities.media);
    } else if (tweetData.entities.urls.length > 0) {
      // console.log("url", tweetData.entities.urls);
    }
  }
};
