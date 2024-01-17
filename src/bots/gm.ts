import { isYesterday, isToday } from "date-fns";
import nconf from "nconf";
// import * as jwt from "jsonwebtoken";

import { client } from "../output/discord";
import { User } from "../database/models/user";
import { Message } from "../database/models/message";
import { assignPoints } from "../controller/user";
import { WalletUser } from "../database/models/walletUsers";
const gmKeywords = ["goodmorning", "gm", "morning", "good morning"];
// const accessTokenSecret = nconf.get("JWT_SECRET");

client.on("messageCreate", async (message: any) => {
  if (message.channelId !== nconf.get("CHANNEL_GM")) return;
  if (message.author.bot) return;

  const content = message.content.toLowerCase();
  // find and cerate user
  await User.findOne({ userID: message.author.id }).then(async (user) => {
    if (user) return;
    // If it's the user's first message
    const usersCount = await User.count();
    const newUser = new User({
      userTag: message.author.tag,
      userID: message.author.id,
      streak: 0,
      maxStreak: 0,
      totalGMs: 0,
      lastGM: message.createdAt,
      gmRank: usersCount + 1,
      discordName: message.author.username,
      discordAvatar: message.author.avatar,
      discordDiscriminator: message.author.discriminator,
      discordVerify: true,
    });
    await newUser.save();
  });

  // good morning?
  if (gmKeywords.includes(content.replace(/[^a-z]/gi, ""))) {
    const newMessage = new Message({
      content: message.cleanContent,
      userTag: message.author.tag,
      userID: message.author.id,
      dateTime: message.createdAt,
    });

    await newMessage.save();

    User.findOne({ userID: message.author.id }).then(async (user) => {
      if (!user) return;
      const lastGM = new Date(user.lastGM || 0);

      user.userTag = message.author.tag;
      user.lastGM = message.createdAt;
      user.discordName = message.author.username;
      user.discordAvatar = message.author.avatar || "";
      user.discordDiscriminator = message.author.discriminator;

      // If user's last gm was yesterday, then continue streak
      // if (isYesterday(lastGM)) {
      //   await gmPoints(user.userID || "");
      // }
      // If user's last gm was older than yesterday, then break streak
      if (!isToday(lastGM)) {
        await gmPoints(user.userID || "");
      } else if (isToday(lastGM) && user.totalGMs == 0) {
        await gmPoints(user.userID || "");
      }
    });

    return;
  }
});

const gmPoints = async (discordId: string) => {
  const walletUser = await WalletUser.findOne({ discordId: discordId });
  if (!walletUser) return;
  await assignPoints(walletUser, 10, "Good Morning Points", true, "gm");
};
