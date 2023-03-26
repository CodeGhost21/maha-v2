import { client } from "../utils/discord";
import { Organization } from "../database/models/organization";
import { executeGMstatement } from "../controller/discord/gm";

client.on("messageCreate", async (message) => {
  const guildId = message.guildId;

  if (!guildId) return;
  if (message.author.bot) return;

  const org = await Organization.findOne({ guildId });
  if (!org) return;

  // make sure we are in the gm chat
  if (message.channelId !== org.gmChannelId) return;

  try {
    await executeGMstatement(guildId, message);
  } catch (error) {
    console.log(error);
    // todo capture on sentry
  }
});

// const assignGmPoints = async (
//   user: IUserModel,
//   messageId: string,
//   points: number
// ) => {
//   const newPointsTransaction = new PointTransaction({
//     userId: user.id,
//     messageId: messageId,
//     type: "gm",
//     totalPoints: user.totalPoints + points,
//     addPoints: points,
//   });
//   await newPointsTransaction.save();
// };
