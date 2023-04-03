import {
  CacheType,
  ButtonStyle,
  ButtonBuilder,
  CommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

import { LoyaltyTask } from "../../database/models/loyaltyTasks";
import { findOrCreateServerProfile } from "../../database/models/serverProfile";
import { calculateBoost } from "../../utils/boost";

export const executeProfileCommand = async (
  interaction: CommandInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { profile, user, organization } = await findOrCreateServerProfile(
    interaction.user,
    guildId
  );
  const allLoyalties = await LoyaltyTask.find({
    organizationId: profile.organizationId,
  });

  const rowItem = allLoyalties.map((item) => ({
    label: item.name,
    description: item.instruction,
    value: item.type,
  }));

  const row = new ActionRowBuilder<
    ButtonBuilder | StringSelectMenuBuilder
  >().addComponents(
    new ButtonBuilder()
      .setCustomId("loyalty")
      .setLabel("View Loyalty Tasks")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("quests")
      .setLabel("View Quests")
      .setStyle(ButtonStyle.Primary)
  );

  let welcome;
  if (!user.twitterID && !user.walletAddress) {
    welcome =
      `You are not verified yet. Use the verify button below to complete your profile. 🔓\n\n` +
      `Once you are verified, you can start boosting your loyalty score to earn more points.`;

    row.addComponents(
      new ButtonBuilder()
        .setCustomId("verify")
        .setLabel("Verify Profile")
        .setStyle(ButtonStyle.Primary)
    );
  } else if (!user.twitterID || !user.walletAddress) {
    welcome =
      `Your account is only partially verified. Use the verify button below to complete your profile. 🔓\n\n` +
      `Once you are fully verified, you can start boosting your points. 🌟`;

    row.addComponents(
      new ButtonBuilder()
        .setCustomId("verify")
        .setLabel("Verify Profile")
        .setStyle(ButtonStyle.Primary)
    );
  } else {
    welcome = `Congratulations 🎉 ! Your account is fully verified. Keep up the great work! 💪`;
  }

  const loyaltyScore = (profile.loyaltyWeight * 100).toFixed(0);
  const boost = calculateBoost(profile.loyaltyWeight, organization.maxBoost);
  const loyalty =
    `Your current loyalty score is \`${loyaltyScore}%\` and you are earning a \`${boost}x\` boost on your points. Complete loyalty tasks` +
    ` to earning more boost. 💖`;

  const points = `You've earned a total of \`${profile.totalPoints} points\` so far.`;

  const d =
    `Hello ${interaction.user}! 👋\n\n` +
    `${welcome}\n\n` +
    `${loyalty}\n\n` +
    `${points}\n`;

  await interaction.reply({
    content: d,
    ephemeral: true,
    components: rowItem.length < 1 ? [] : [row],
  });
};
