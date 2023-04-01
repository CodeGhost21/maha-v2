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

export const executeProfileCommand = async (
  interaction: CommandInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { profile, user } = await findOrCreateServerProfile(
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
    // new StringSelectMenuBuilder()
    //   .setCustomId("loyalty-select")
    //   .setPlaceholder("View pending loyalty tasks")
    //   .addOptions(rowItem),
    new ButtonBuilder()
      .setCustomId("loyalty")
      .setLabel("View Loyalty Tasks")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("quests")
      .setLabel("View Quests")
      .setStyle(ButtonStyle.Primary)
    // new ButtonBuilder()
    //   .setLabel(user.twitterID ? "Verify Account" : "Verify Twitter")
    //   .setStyle("LINK")
    //   .setDisabled(!!user.twitterID),
    // // .setURL(urlJoin(frontendUrl, `/verify-twitter?token=${token}`))
    // new ButtonBuilder()
    //   .setLabel("View Loyalty Tasks")
    //   .setStyle("LINK")
    //   .setDisabled(!!user.twitterID)
    // .setURL(urlJoin(frontendUrl, `/verify-twitter?token=${token}`))
  );

  //   verify
  // quests
  // loyalty

  // ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder>

  let welcome;
  if (!user.twitterID && !user.walletAddress) {
    welcome =
      `You are not verified yet. Use the \`/verify\` command to verify your verification. 🔓\n\n` +
      `Once you are verified, you can start boosting your loyalty score to earn more points.`;
  } else if (!user.twitterID || !user.walletAddress) {
    welcome =
      `Your account is only partially verified. Use the \`/verify\` command to complete your verification. 🔓\n\n` +
      `Once you are fully verified, you can start boosting your points. 🌟`;
  } else {
    welcome = `Congratulations 🎉 ! Your account is fully verified. Keep up the great work! 💪`;
  }

  const loyaltyScore = (profile.loyaltyWeight * 100).toFixed(2);
  const loyalty =
    `Your current loyalty score is \`${loyaltyScore}%\`. Complete loyalty tasks` +
    ` to start earning a boost on your points. 💖`;

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
