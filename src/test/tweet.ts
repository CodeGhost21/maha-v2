import nconf, { loadFiles } from "nconf";
import { json } from "stream/consumers";
import { checkTweetMAHA } from "../controller/quests/tweetMaha";
import { sendRequest } from "../controller/utils/sendRequest";
import { fetchTweetId } from "../controller/zealyBot";

export const tweetData = async () => {
  const url = `https://api.twitter.com/1.1/statuses/show.json?id=1653285298783289346&tweet_mode=extended`;

  const header = {
    Authorization: `Bearer ${nconf.get("TWITTER_TOKEN")}`,
  };
  const tweetData: any = await sendRequest("get", url, header);
  const parseTweetData = JSON.parse(tweetData);
  const words: string[] = parseTweetData.full_text
    .toLowerCase()
    .replace(/[.,\n]/g, " ")
    .split(" ");
  const mahaTypes = ["MAHA", "MahaDAO", "$MAHA", "$ARTH", "ARTH"].map((t) =>
    t.toLowerCase()
  );
  const isValid = words.findIndex((word) => mahaTypes.includes(word)) >= 0;
  console.log(isValid);

  //   const response = await checkTweetMAHA(
  //     "1651667394665013250",
  //     "b3aab67a-0483-4f8f-bff0-0347c719a5f2",
  //     "iCrypto_Sam"
  //   );

  //   console.log(response);
};

//b3aab67a-0483-4f8f-bff0-0347c719a5f2

export const tweetRateLimit = async () => {
  const max = 1000;
  try {
    for (let i = 0; i <= max; i++) {
      const url = `https://api.twitter.com/1.1/statuses/show.json?id=1651667394665013250&tweet_mode=extended`;

      const header = {
        Authorization: `Bearer ${nconf.get("TWITTER_TOKEN")}`,
      };
      const tweetData: any = await sendRequest("get", url, header);
      console.log("response ", i);
    }
  } catch (e: any) {
    console.log(">>>>>>>>>", e.statusCode);
    if (e.statusCode === 429) {
      console.log("rate limit issue");
      return;
    }
  }
};
