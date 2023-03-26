import { isYesterday, isToday } from "date-fns";
import { client } from "../utils/discord";
import { User } from "../database/models/user";
import { assignRank } from "../utils/upadteRank";
import { Organization } from "../database/models/organization";
import { Message } from "../database/models/message";
import {
  findOrCreateServerProfile,
  ServerProfile,
} from "../database/models/serverProfile";
import { completeLoyaltyTask } from "../controller/loyaltyTask";

const gmKeywords = ["goodmorning", "gm", "morning", "good morning"];
const lbKeywords = ["!leaderboard", "!lb"];
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
  "❌",
  "✅",
  "🔥",
  "✋",
];

client.on("messageCreate", async (message) => {
  const content = message.content.toLowerCase();
  const guildId = message.guildId;

  if (!guildId) return;
  if (message.author.bot) return;

  const org = await Organization.findOne({ guildId });
  if (!org) return;

  // make sure we are in the gm chat
  if (message.channelId !== org.gmChannelId) return;

  // find and cerate user
  const results = await findOrCreateServerProfile(message.author.id, guildId);
  const user = results.user;
  const profile = results.profile;

  // if it was a new user; then we capture the discord details
  if (results.userCreated) {
    user.discordTag = message.author.tag;
    user.discordId = message.author.id;
    user.discordName = message.author.username;
    if (message.author.avatar) user.discordAvatar = message.author.avatar;
    user.discordDiscriminator = message.author.discriminator;
    await user.save();
  }

  // if this user's first time in this server then we intro the gm chat.
  if (results.profileCreated) {
    const count = await User.count();

    profile.totalGMs = 0;
    profile.streak = 0;
    profile.maxStreak = 0;
    profile.lastGM = message.createdAt;
    profile.gmRank = count + 1;
    profile.save();

    // If it's the user's first message
    message.channel.send(
      `**Welcome to the good morning channel <@${message.author.id}>**!\n\n` +
        `Just say "Good Morning" or "Gm" once everyday and ` +
        ` start a streak. Rewards are given out every month to GM-ers with the highest streak and highest monthly streak. ` +
        `You can use **!gm** to see your streak and **!lb** or **!leaderboard** to view the leaderboards.\n\n` +
        `Try it out! Say "Good Morning" 🌞`
    );
  }

  // leaderboard?
  if (lbKeywords.includes(content)) {
    const profiles = await ServerProfile.find({
      organizationId: profile.organizationId,
    }).populate("userId.discordTag");

    const top = profiles
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 10)
      .map(
        (u) =>
          `🔥 **${u.userId.discordTag}** is on a **${u.streak}** GM streak!`
      )
      .join("\n");

    const total = profiles
      .sort((a, b) => b.totalGMs - a.totalGMs)
      .slice(0, 10)
      .map(
        (u, i) =>
          `${total_icons[i]} **${u.userId.discordTag}** has said gm **${
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

    const lastGM = new Date(profile.lastGM || 0);

    profile.lastGM = message.createdAt;

    // If user's last gm was yesterday, then continue streak
    if (isYesterday(lastGM)) {
      const response = await completeLoyaltyTask(profile, "gm");
      if (response) {
        profile.streak += 1;
        profile.maxStreak =
          profile.streak > profile.maxStreak
            ? profile.streak
            : profile.maxStreak;
        profile.totalGMs += 1;
        profile.save();
      }
    }

    // If user's last gm was older than yesterday, then break streak
    else if (!isToday(lastGM)) {
      const response = await completeLoyaltyTask(profile, "gm");
      if (response) {
        profile.streak = 1;
        profile.totalGMs += 1;
        profile.save();
      }
    } else if (isToday(lastGM) && profile.totalGMs == 0) {
      const response = await completeLoyaltyTask(profile, "gm");
      if (response) {
        profile.streak = 1;
        profile.totalGMs = 1;
        profile.maxStreak = 1;
        profile.save();
      }
    }
    const rankResult = await assignRank(profile);
    const text = `gm <@${message.author.id}>!\nYou've said gm for **${
      profile.streak
    } day${profile.streak > 1 ? "s" : ""} in a row** 🔥 and a total of ${
      profile.totalGMs
    } time${profile.streak > 1 ? "s" : ""} 🥳 your rank is ${
      rankResult.rank
    } out of ${rankResult.totalUsers}`;

    message.channel.send(text).then().catch(console.log);
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
