import { fetchTweetData } from "../../utils/tweetData";

export const checkTweetMAHA = async (
  tweetId: string,
  twitterUserName: string,
  quest: any
) => {
  const mahaTypes = ["#zerolend", "@zerolend"].map((t) => t.toLowerCase());
  const url = `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}&tweet_mode=extended`;
  const tweetData: any = await fetchTweetData(url, twitterUserName);
  if (tweetData.success) {
    for (let i = 0; i < mahaTypes.length; i++) {
      const words: string[] = tweetData.tweet.full_text
        .toLowerCase()
        .replace(/[.,”\n?]/g, " ")
        .replace(/\s+/g, " ")
        .split(" ");

      const isValid = words.findIndex((word) => mahaTypes.includes(word)) >= 0;

      if (isValid) {
        //save zelay user if doesn't exists
        break;
      }
    }
  }
};
