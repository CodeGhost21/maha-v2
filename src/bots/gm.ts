import { isYesterday, isToday } from "date-fns";
import nconf from "nconf";
import { client } from "../utils/discord";
import { IUserModel, User } from "../database/models/user";
import { assignRank } from "../utils/upadteRank";
import { PointTransaction } from "../database/models/pointTransaction";
import { Organization } from "../database/models/organisation";
import { completeTask } from "../controller/task";

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

  if (message.channelId === nconf.get("CHANNEL_GM")) {
    if (!message.guild) return;
    if (message.author.bot) return;

    const organizationDetails: any = await Organization.findOne({
      guildId: message.guildId,
    });

    // find and cerate user
    await User.findOne({ userID: message.author.id }).then(async (user) => {
      if (!user) {
        // If it's the user's first message
        const users = await User.find();
        user = new User({
          userTag: message.author.tag,
          userID: message.author.id,
          streak: 0,
          maxStreak: 0,
          totalGMs: 0,
          lastGM: message.createdAt,
          gmRank: users.length + 1,
          discordName: message.author.username,
          discordAvatar: message.author.avatar,
          discordDiscriminator: message.author.discriminator,
          discordVerify: true,
          organizationId: organizationDetails.id,
        });

        await user.save();
        message.channel.send(
          `**Welcome to the good morning channel <@${message.author.id}>**!\n\n` +
          `Just say "Good Morning" or "Gm" once everyday and ` +
          ` start a streak. Rewards are given out every month to GM-ers with the highest streak and highest monthly streak. ` +
          `You can use **!gm** to see your streak and **!lb** or **!leaderboard** to view the leaderboards.\n\n` +
          `Try it out! Say "Good Morning" 🌞`
        );
      }
    });

    // leaderboard?
    if (lbKeywords.includes(content)) {
      User.find({})
        .lean()
        .then((users) => {
          const top = users
            .sort((a, b) => b.streak - a.streak)
            .slice(0, 10)
            .map(
              (u) => `🔥 **${u.userTag}** is on a **${u.streak}** GM streak!`
            )
            .join("\n");

          const total = users
            .sort((a, b) => b.totalGMs - a.totalGMs)
            .slice(0, 10)
            .map(
              (u, i) =>
                `${total_icons[i]} **${u.userTag}** has said gm **${u.totalGMs
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
      // const newMessage = new Message({
      //   content: message.cleanContent,
      //   userTag: message.author.tag,
      //   userID: message.author.id,
      //   dateTime: message.createdAt,
      // });

      // await newMessage.save();

      User.findOne({ userID: message.author.id }).then(async (user) => {
        if (!user) return;
        //check for maha staked
        // let points = 10;
        // if (user.stakedMaha) {
        //   points = 100;
        // }

        const lastGM = new Date(user.lastGM || 0);

        user.userTag = message.author.tag;
        user.lastGM = message.createdAt;
        user.discordName = message.author.username;
        user.discordAvatar = message.author.avatar || "";
        user.discordDiscriminator = message.author.discriminator;
        user.organizationId = organizationDetails.id;

        // If user's last gm was yesterday, then continue streak
        if (isYesterday(lastGM)) {
          const response = await completeTask(user, "gm");
          if (response) {

            user.streak += 1;
            user.maxStreak =
              user.streak > user.maxStreak ? user.streak : user.maxStreak;
            user.totalGMs += 1;
            user.save();
          }
        }

        // If user's last gm was older than yesterday, then break streak
        else if (!isToday(lastGM)) {
          const response = await completeTask(user, "gm");
          if (response) {
            user.streak = 1;
            user.totalGMs += 1;
            user.save();
          }
        } else if (isToday(lastGM) && user.totalGMs == 0) {
          const response = await completeTask(user, "gm");
          if (response) {
            user.streak = 1;
            user.totalGMs = 1;
            user.maxStreak = 1;
            user.save();
          }
        }
        const rankResult = await assignRank(user.userID || "");
        const text = `gm <@${message.author.id}>!\nYou've said gm for **${user.streak
          } day${user.streak > 1 ? "s" : ""} in a row** 🔥 and a total of ${user.totalGMs
          } time${user.streak > 1 ? "s" : ""} 🥳 your rank is ${rankResult.rank
          } out of ${rankResult.totalUsers}`;

        message.channel.send(text).then().catch(console.log);
      });
    }
  }
  return;
});

const assignGmPoints = async (
  user: IUserModel,
  messageId: string,
  points: number
) => {
  const newPointsTransaction = new PointTransaction({
    userId: user.id,
    messageId: messageId,
    type: "gm",
    totalPoints: user.totalPoints + points,
    addPoints: points,
  });
  await newPointsTransaction.save();
};
