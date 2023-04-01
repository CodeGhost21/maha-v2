import {
  CacheType,
  CommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";

import { findOrCreateServerProfile } from "../../database/models/serverProfile";
import { Task, TaskTypes } from "../../database/models/tasks";

export const executeTasksCommand = async (
  interaction: CommandInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { organization, user, profile } = await findOrCreateServerProfile(
    interaction.user.id,
    guildId
  );
  const allTasks = await Task.find({ organizationId: organization?.id });
  const rowItem = allTasks.map((item) => ({
    label: item.name,
    description: item.instruction,
    value: item.type,
  }));

  const content: string =
    `Welcome ${interaction.user}! These are your available quests. You can complete them to earn points.\n\n` +
    ` You currently have ${profile.loyaltyWeight.toFixed(
      2
    )}% loyalty earning a 0x boost. You can earn more boost by completing loyalty tasks using \`/loyalty\`.` +
    `Happy points hunting! 🌱💖`;

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("task-select")
      .setPlaceholder("Select a quest")
      .addOptions(rowItem)
  );

  if (rowItem.length < 1) {
    await interaction.reply({
      content: "No quests have been created yet.",
      ephemeral: true,
    });
    return;
  }

  if (!user.twitterID || !user.walletAddress) {
    await interaction.reply({
      content: "Verify yourself using `/verify` to perform any quests.",
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    content: content,
    ephemeral: true,
    components: [row],
  });
};

export const executeTaskSelectInput = async (
  interaction: StringSelectMenuInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const value = interaction.values[0] as TaskTypes;

  const { organization } = await findOrCreateServerProfile(
    interaction.user.id,
    guildId
  );

  const quest = await Task.findOne({
    organizationId: organization.id,
    type: value,
  });

  if (!quest) {
    await interaction?.reply({
      content: `Invalid quest`,
      ephemeral: true,
    });
    return;
  }

  // send instructions for gm
  if (value === "gm") {
    const content =
      `Hey ${interaction?.user}! Go and say "GM" in the <#${organization.gmChannelId}> channel. You will automatically get` +
      `${quest.points} points every day for a good morning 🌞.`;

    await interaction?.reply({
      content,
      ephemeral: true,
    });
    return;
  }

  // send instructions for gm
  if (value === "form") {
    const content = quest.instruction;
    await interaction?.reply({
      content,
      ephemeral: true,
    });
    return;
  }

  // // send instructions for twitter follow
  // if (value === "twitter_follow") {
  //   msg = `Follow the MAHADAO twitter page and earn points daily.`;
  //   const row = new ActionRowBuilder().addComponents(
  //     new ButtonBuilder()
  //       .setLabel("Follow @MAHADAO")
  //       .setStyle("LINK")
  //       .setURL("https://twitter.com/TheMahaDAO")
  //   );
  //   await interaction?.reply({
  //     content: `Hey ${interaction?.user}, ${msg}`,
  //     ephemeral: true,
  //     components: [row],
  //   });
  // } else if (value === "hold_nft") {
  //   msg = `You have to hold a citizenship and you would earn points daily.`;
  //   await interaction?.reply({
  //     content: `Hey ${interaction?.user}, ${msg}`,
  //     ephemeral: true,
  //   });
  // }
};
