import { isYesterday, isToday } from "date-fns";
import { User } from "../../database/models/user";
import { assignRank } from "../../utils/upadteRank";
import {
  findOrCreateServerProfile,
  ServerProfile,
} from "../../database/models/serverProfile";
import { Task } from "../../database/models/tasks";
import { completeTask } from ".";
import * as discord from "discord.js";
import { Message } from "../../database/models/message";

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

export const executeGMstatement = async (
  guildId: string,
  message: discord.Message<boolean>
) => {
  const content = message.content.toLocaleLowerCase().trim();

  // find and cerate user
  const results = await findOrCreateServerProfile(message.author.id, guildId);
  const user = results.user;
  const profile = results.profile;
  // if it was a new user; then we capture the discord details
  // if (results.userCreated) {
  //capture discord details for old users and new users
  user.discordTag = message.author.tag;
  user.discordId = message.author.id;
  user.discordName = message.author.username;
  if (message.author.avatar) user.discordAvatar = message.author.avatar;
  user.discordDiscriminator = message.author.discriminator;
  await user.save();
  // }

  const checkTask = await Task.findOne({
    type: "gm",
    organizationId: profile.organizationId,
  });
  if (checkTask) {
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
      }).populate("userId");

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
        profileId: profile.id,
        organizationId: profile.organizationId,
        dateTime: message.createdAt,
      });

      await newMessage.save();

      const lastGM = new Date(profile.lastGM || 0);

      profile.lastGM = message.createdAt;

      // If user's last gm was yesterday, then continue streak
      if (isYesterday(lastGM)) {
        const response = await completeTask(profile, "gm");
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
        const response = await completeTask(profile, "gm");
        if (response) {
          profile.streak = 1;
          profile.totalGMs += 1;
          profile.save();
        }
      } else if (isToday(lastGM) && profile.totalGMs == 0) {
        const response = await completeTask(profile, "gm");
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
  }
};
