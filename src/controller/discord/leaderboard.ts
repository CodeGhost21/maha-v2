import { CacheType, CommandInteraction } from "discord.js";
import {
  findOrCreateWithDiscordId,
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
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { profile } = await findOrCreateWithDiscordId(
    interaction.user.id,
    guildId
  );

  const profiles = await ServerProfile.find({
    organizationId: profile.organizationId,
  }).populate("userId.discordTag");

  const top = profiles
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 10)
    .map(
      (u, i) =>
        `${total_icons[i]} **${u.userId.discordTag}** - **${u.totalPoints}** points!`
    )
    .join("\n");

  const text = "__Top 10 rankers__ 🏆\n" + top;

  interaction.reply(text);
};
