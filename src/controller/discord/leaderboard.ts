import { CacheType, CommandInteraction } from "discord.js";
import {
  findOrCreateServerProfile,
  ServerProfile,
} from "../../database/models/serverProfile";

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

export const executeLeaderboardCommand = async (
  interaction: CommandInteraction<CacheType>
) => {
  try {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const { profile } = await findOrCreateServerProfile(
      interaction.user,
      guildId
    );

    const profiles = await ServerProfile.find({
      organizationId: profile.organizationId,
    }).populate("userId");

    const top = profiles
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10)
      .map(
        (u, i) =>
          `${total_icons[i]} **<@${u.userId.discordId}>** - **${u.totalPoints}** points!`
      )
      .join("\n");

    const text = "__Top 10 rankers__ 🏆\n" + top;

    interaction.reply(text);
  } catch (error) {
    console.error(error);
  }
};
