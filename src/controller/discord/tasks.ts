import {
  CacheType,
  CommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  ModalActionRowComponentBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction
} from "discord.js";

import { findOrCreateServerProfile } from "../../database/models/serverProfile";
import { Task, TaskTypes } from "../../database/models/tasks";
import { calculateBoost } from "../../utils/boost";

export const executeTasksCommand = async (
  interaction: CommandInteraction<CacheType> | ButtonInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { organization, user, profile } = await findOrCreateServerProfile(
    interaction.user,
    guildId
  );
  const allTasks = await Task.find({ organizationId: organization?.id });
  const rowItem = allTasks.map((item) => ({
    label: item.name,
    description: item.instruction,
    value: item.type,
  }));

  const boost = calculateBoost(profile.loyaltyWeight, organization.maxBoost);

  const content: string =
    `These are your available quests.\n\n` +
    `You currently have \`${profile.totalPoints} points\`. You can earn more points by completing the quests below.\n\n` +
    `You also have a \`${boost}x\` boost. You can earn more boost by completing loyalty tasks using the \`/loyalty\` command. ` +
    `\n\nHappy point farming! 🌱👩‍🌾💖\n\n`;

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

  const { organization, profile, user } = await findOrCreateServerProfile(
    interaction.user,
    guildId
  );

  const boost = calculateBoost(profile.loyaltyWeight, organization.maxBoost);

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

  const hasInvalidTwitter = quest.isTwitterRequired && !user.twitterID;
  const hasInvalidWallet = quest.isWalletRequired && !user.walletAddress;

  if (hasInvalidTwitter || hasInvalidWallet) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("verify")
        .setLabel("Verify Profile")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content:
        "You need to verify your twitter/wallet first before you can perform this quest.",
      ephemeral: true,
      components: [row],
    });
    return;
  }

  // send instructions for gm
  if (value === "gm") {
    const content =
      `Hey ${interaction?.user}! Go and say "GM" in the <#${organization.gmChannelId}> channel. You will automatically get` +
      ` \`${quest.points} points\` (with a \`${boost}x\` boost) every day for a good morning 🌞.`;

    await interaction?.reply({
      content,
    });
    return;
  }

  // send instructions for form
  if (value === "form") {
    const content = quest.instruction;

    const modal = new ModalBuilder()
      .setCustomId('modal')
      .setTitle('Modal')


    const row = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('favoriteColorInput')
        .setLabel("What's your favorite color?")
        .setPlaceholder('Enter Color')
        .setStyle(TextInputStyle.Short)
    )

    modal.addComponents(row);

    interaction.showModal(modal)

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

export const executeTaskModalSubmit = (
  interaction: ModalSubmitInteraction<CacheType>
) => {
  console.log(interaction.fields)
}
