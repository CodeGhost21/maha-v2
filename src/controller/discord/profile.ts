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
    interaction.user.id,
    guildId
  );
  const allLoyalties = await LoyaltyTask.find({
    organizationId: profile.organizationId,
  });

  let content: string;

  const rowItem = allLoyalties.map((item) => ({
    label: item.name,
    description: item.instruction,
    value: item.type,
  }));

  const row = new ActionRowBuilder<
    ButtonBuilder | StringSelectMenuBuilder
  >().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("loyalty-select")
      .setPlaceholder("View pending loyalty tasks")
      .addOptions(rowItem),
    new ButtonBuilder()
      .setCustomId("primary")
      .setLabel("Click me!")
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

  // ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder>

  if (!user.twitterID && !user.walletAddress) {
    content =
      `Hey there, ${interaction.user}! 👋 \n\n` +
      `Your account isn't verified yet. To get started with our awesome Gifts of Eden loyalty program, use the \`/verify\` command to verify your account. 🔓\n\n` +
      `Once you're verified, you can start boosting your loyalty score, which is currently at 0%. Use the */loyalty* command to boost your loyalty score.\n\n` +
      `You've earned a total of 0 points so far, but by checking out all the tasks available to earn points, you'll be on your way to racking up that score in no time. Just use the */quests* command to discover more! 🚀`;
  } else if (!user.twitterID || !user.walletAddress) {
    content =
      `Hey there, ${interaction.user}! 👋 \n\n` +
      `We noticed that your account is just partially verified. To get started with our awesome Gifts of Eden loyalty program, use the */verify* command to verify your account. 🔓\n\n` +
      `Once you're verified, you can start boosting your loyalty score, which is currently at 0%. Don't worry, there are plenty of tasks to help you increase it! 🌟\n\n` +
      `You've earned a total of 0 points so far, but by checking out all the tasks available to earn points, you'll be on your way to racking up that score in no time. Just use the */quests* command to discover more! 🚀\n\n` +
      `Don't forget to verify your account and dive into these tasks to start earning points and boosting your loyalty score! 💪`;
  } else {
    content =
      `Hey there, ${interaction.user}! 👋 \n\n` +
      `Congratulations your account is verified! 🎉 You're all set to enjoy the benefits of our Gifts of Eden.\n\n` +
      `Your current loyalty score is ${(profile.loyaltyWeight * 100).toFixed(
        2
      )}%. If you haven't completed all the loyalty tasks yet, be sure to finish them to boost your loyalty even more! 🚀\n\n` +
      `You've earned a total of ${profile.totalPoints} points so far. Remember, you can always check all the tasks available to earn points using the */quests* command. Keep up the great work! 💪\n\n` +
      `Continue exploring these tasks to earn more points and boost your loyalty score even further! 💖`;
  }

  if (!user.twitterID || !user.walletAddress || rowItem.length < 1) {
    await interaction.reply({
      content,
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content,
      ephemeral: true,
      components: [row],
    });
  }
};
