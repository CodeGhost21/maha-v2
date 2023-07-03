import { twitterRequest } from "../../utils/twitterRequest";
import { zelayRequest } from "../../utils/zelayRequest";
import { approveQuest } from "../reviewQuest";

export const mahaPatronCheck = async (quest: any) => {
  await twitterBioCheck(quest);
  // await discordBioCheck();
};

const twitterBioCheck = async (quest: any) => {
  let questStatus = "fail";
  let comment = "";
  const zelayUserData = await zelayRequest(
    "get",
    `https://api.zealy.io/communities/themahadao/users/${quest.user.id}`
  );

  const twitterUserData = await twitterRequest(
    "get",
    `https://api.twitter.com/1.1/users/show.json?screen_name=${zelayUserData.data.twitterUsername}`
  );

  const checkPatron = "Proud $MAHA Patron 🟠";
  // console.log(">>>>>>>>>>>", twitterUserData.description);

  if (twitterUserData.description.includes(checkPatron)) {
    // console.log("twitter bio", true);
    questStatus = "success";
  } else {
    // console.log("twitter bio", false);
    questStatus = "fail";
    comment = "not a $MAHA patron ";
  }

  if (questStatus === "success") {
    await approveQuest([quest.id], questStatus, comment);
  }
};

// const discordBioCheck = async () => {
//   try {
//     const options = {
//       url: "https://discord.com/api/v9/users",
//       headers: {
//         Authorization: `Bot ${nconf.get("DISCORD_CLIENT_TOKEN")}`,
//       },
//       qs: {
//         q: "sAm#2582",
//         limit: 1,
//       },
//       json: true,
//     };
//     const userData = await rp(options);
//     console.log(userData);
//   } catch (error) {
//     console.error(error);
//   }
// };
