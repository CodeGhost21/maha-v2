import Bluebird from "bluebird";
import nconf from "nconf";

import { sendRequest } from "./utils/sendRequest";
import { checkTransaction } from "./quests/transaction";
import { checkTwitterMeme } from "./quests/tweetMeme";
import { checkTweetMAHA } from "./quests/tweetMaha";
import { checkShillMaha } from "./quests/tweetShill";

const fetchTweetId = (uri: string) => {
  const match = uri.match("status\\/(\\d+)/?");
  return match && match.length > 0 ? match[1] : undefined;
};

export const submissions = async () => {
  const url = "https://api.zealy.io/communities/themahadao/claimed-quests";
  const header = {
    "x-api-key": `${nconf.get("ZEALY_API_KEY")}`,
  };
  const submissions: any = await sendRequest("get", url, header);
  const parseSubmissions = JSON.parse(submissions);

  await Bluebird.mapSeries(parseSubmissions.data, async (quest: any) => {
    if (quest.submission.value !== undefined) {
      if (quest.submission.value.includes("tx")) {
        const regex = /tx\/(0x[a-fA-F0-9]{64})/;
        const match = quest.submission.value.match(regex);
        await checkTransaction(match[1]);
      }

      // is the account owner and submission owner the same?
      // is the link valid?
      // else if (quest.name === "Meme about $MAHA") {
      //   const tweetId: any = fetchTweetId(quest.submission.value);
      //   if (tweetId !== undefined) {
      //     console.log(quest.user.twitterUsername);
      //     await checkTwitterMeme(tweetId, quest.id, quest.user.twitterUsername);
      //   }
      // }
      else if (quest.name === "Tweet about MahaDAO 🐦") {
        const tweetId: any = fetchTweetId(quest.submission.value);
        if (tweetId !== undefined) {
          await checkTweetMAHA(tweetId, quest.id, quest.user.twitterUsername);
        }
      } else if (quest.name === "Shill $MAHA to an influencer") {
        const tweetId: any = fetchTweetId(quest.submission.value);
        if (tweetId !== undefined) {
          await checkShillMaha(tweetId, quest.id, quest.user.twitterUsername);
        }
      }
    }
  });
};
