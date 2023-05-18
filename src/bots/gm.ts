import { isYesterday, isToday } from "date-fns";
import nconf from "nconf";
import * as jwt from "jsonwebtoken";

import { client } from "../output/discord";
import { User } from "../database/models/user";
import { Message } from "../database/models/message";
import { assignRank } from "../helper/upadteRank";
import { zelayRequest } from "../utils/zelayRequest";
import { userBonus } from "../controller/zealyBot";
const gmKeywords = ["goodmorning", "gm", "morning", "good morning"];
const lbKeywords = ["!leaderboard", "!lb"];
const accessTokenSecret = nconf.get("JWT_SECRET");

client.on("messageCreate", async (message: any) => {
  if (message.channelId !== nconf.get("CHANNEL_GM") && !message.guild) return;
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  const zelayUserData = await zelayRequest(
    "get",
    `https://api.zealy.io/communities/themahadao/users?discordId=${message.author.id}`
  );
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
    //save zelay users data

    if (zelayUserData.success) {
      newUser.zelayUserId = zelayUserData.data.id;
      newUser.zelayUserName = zelayUserData.data.name;
      await newUser.save();
    }

    const token = await jwt.sign({ id: String(newUser.id) }, accessTokenSecret);
    newUser.jwt = token;
    await newUser.save();

    message.channel.send(
      `**Welcome to the good morning channel <@${message.author.id}>**!\n\n` +
        `Just say "Good Morning" or "Gm" once everyday and ` +
        ` start a streak. Rewards are given out every month to GM-ers with the highest streak and highest monthly streak. ` +
        `You can use **!gm** to see your streak and **!lb** or **!leaderboard** to view the leaderboards.\n\n` +
        `Try it out! Say "Good Morning" 🌞`
    );
  });

  // leaderboard?
  if (lbKeywords.includes(content)) {
    User.find({})
      .lean()
      .then((users) => {
        const top = users
          .sort((a, b) => b.streak - a.streak)
          .slice(0, 10)
          .map((u) => `🔥 **${u.userTag}** is on a **${u.streak}** GM streak!`)
          .join("\n");

        const total_icons = [
          "🥇",
          "🥈",
          "🥉",
          "🎉",
          "🎉",
          "🤲",
          "🤲",
          "🤲",
          "🤲",
          "🤲",
        ];

        const total = users
          .sort((a, b) => b.totalGMs - a.totalGMs)
          .slice(0, 10)
          .map(
            (u, i) =>
              `${total_icons[i]} **${u.userTag}** has said gm **${
                u.totalGMs
              } time${u.totalGMs > 1 ? "s" : ""}**.`
          )
          .join("\n");

        const text =
          "__Top 10 gm streaks__ 🏆\n" +
          top +
          "\n\n__Top 10 total gm’s__ 🏆\n" +
          total;

        message.reply(text);
      });
    return;
  }

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

      const points = 10;

      const lastGM = new Date(user.lastGM || 0);

      user.userTag = message.author.tag;
      user.lastGM = message.createdAt;
      user.discordName = message.author.username;
      user.discordAvatar = message.author.avatar || "";
      user.discordDiscriminator = message.author.discriminator;
      user.zelayUserId = zelayUserData.data.id;
      user.zelayUserName = zelayUserData.data.name;

      // If user's last gm was yesterday, then continue streak
      if (isYesterday(lastGM)) {
        await assignGmPoints(points, user.zelayUserId);
        user.streak += 1;
        user.maxStreak =
          user.streak > user.maxStreak ? user.streak : user.maxStreak;
        user.totalGMs += 1;
        user.save();
      }

      // If user's last gm was older than yesterday, then break streak
      else if (!isToday(lastGM)) {
        await assignGmPoints(points, user.zelayUserId);
        user.streak = 1;
        user.totalGMs += 1;
        user.save();
      } else if (isToday(lastGM) && user.totalGMs == 0) {
        await assignGmPoints(points, user.zelayUserId);
        user.streak = 1;
        user.totalGMs = 1;
        user.maxStreak = 1;
        user.save();
      }
      const rankResult = await assignRank(user.userID || "");
      const text = `gm <@${message.author.id}>!\nYou've said gm for **${
        user.streak
      } day${user.streak > 1 ? "s" : ""} in a row** 🔥 and a total of ${
        user.totalGMs
      } time${user.streak > 1 ? "s" : ""} 🥳 your rank is ${
        rankResult.rank
      } out of ${rankResult.totalUsers}`;

      message.channel.send(text).then().catch(console.log);
    });

    return;
  }
});

const assignGmPoints = async (points: number, userId: string) => {
  if (userId !== "") {
    await userBonus(userId, points, "gm points", "rewards");
  }
};
