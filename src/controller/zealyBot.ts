import Bluebird from "bluebird";
import nconf from "nconf";

import { sendRequest } from "./utils/sendRequest";
import { checkTransaction } from "./quests/transaction";
import { checkTwitterMeme } from "./quests/tweetMeme";
import { checkTweetMAHA } from "./quests/tweetMaha";
import { checkShillMaha } from "./quests/tweetShill";

export const fetchTweetId = (uri: string) => {
  const tweetId = uri.match("status\\/(\\d+)/?");
  return tweetId && tweetId.length > 0 ? tweetId[1] : undefined;
};

export const fetchTwitterUserName = async (uri: string) => {
  const twitterUserName = uri.match(/https:\/\/twitter\.com\/(\w+)\//);
  return twitterUserName && twitterUserName.length > 0
    ? twitterUserName[1]
    : undefined;
};

export const submissions = async () => {
  const url = "https://api.zealy.io/communities/themahadao/claimed-quests";
  const header = {
    "x-api-key": `${nconf.get("ZEALY_API_KEY")}`,
  };
  const submissions: any = await sendRequest("get", url, header);
  const parseSubmissions = JSON.parse(submissions);
  const pendingSubmissions = await parseSubmissions.data.filter(
    (item: any) => item.status === "pending"
  );
  await Bluebird.mapSeries(pendingSubmissions, async (quest: any) => {
    if (quest.submission.value !== undefined) {
      if (quest.submission.value.includes("tx")) {
        const regex = /tx\/(0x[a-fA-F0-9]{64})/;
        const match = quest.submission.value.match(regex);
        await checkTransaction(match[1], quest.id);
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
      // else if (quest.name === "Tweet about MahaDAO 🐦") {
      //   const tweetId: any = fetchTweetId(quest.submission.value);
      //   if (tweetId !== undefined) {
      //     const twitterUserName: any = await fetchTwitterUserName(
      //       quest.submission.value
      //     );
      //     await checkTweetMAHA(tweetId, quest.id, twitterUserName);
      //   }
      // }
      else if (quest.name === "Shill $MAHA to an Influencer") {
        console.log(quest.name);
        const tweetId: any = fetchTweetId(quest.submission.value);
        if (tweetId !== undefined) {
          console.log(quest.submission.value);
          const twitterUserName: any = await fetchTwitterUserName(
            quest.submission.value
          );
          await checkShillMaha(
            tweetId,
            quest.id,
            twitterUserName,
            quest.user.id
          );
        }
      }
    }
  });
};

export const userBonus = async (
  userId: string,
  points: number,
  label: string
) => {
  const url = `https://api.zealy.io/communities/themahadao/users/${userId}/xp`;
  const header = {
    "x-api-key": `${nconf.get("ZEALY_API_KEY")}`,
  };

  const body = {
    label: label,
    xp: points,
    description: "review points",
  };

  const response: any = await sendRequest("post", url, header, body);
  console.log(response);
  return response;
};

// export const failedQuest = async () => {
//   const url = "https://api.zealy.io/communities/themahadao/claimed-quests";
//   const header = {
//     "x-api-key": `${nconf.get("ZEALY_API_KEY")}`,
//   };
//   const submissions: any = await sendRequest("get", url, header);
//   const parseSubmissions = JSON.parse(submissions);
//   const filteredQuest = parseSubmissions.data.filter(
//     (quest: any) =>
//       quest.status === "fail" && quest.name === "Tweet about MahaDAO 🐦"
//   );
//   await Bluebird.mapSeries(filteredQuest, async (quest: any) => {
//     const tweetId: any = fetchTweetId(quest.submission.value);
//     if (tweetId !== undefined) {
//       await questPoints(tweetId, quest);
//     }
//   });
// };
