import {
  CacheType,
  CommandInteraction,
  MessageActionRow,
  MessageSelectMenu,
} from "discord.js";

import {
  LoyaltyTask,
  LoyaltyTaskType,
} from "../../database/models/loyaltyTasks";
import { findOrCreateServerProfile } from "../../database/models/serverProfile";
import { sendFeedDiscord } from "../../utils/sendFeedDiscord";
import { completeLoyaltyTask } from "../loyaltyTask";

export const executeProfileCommand = async (
  interaction: CommandInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { profile, user } = await findOrCreateServerProfile(
    interaction.user.id,
    guildId
  );

  let content: string;

  const allLoyalties = await LoyaltyTask.find({
    organizationId: profile.organizationId,
  });

  const rowItem = allLoyalties.map((item) => ({
    label: item.name,
    description: "description",
    value: item.type,
  }));

  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId("taskSelect")
      .setPlaceholder("Select a task")
      .addOptions(rowItem)
  );

  if (!user.twitterID && !user.walletAddress) {
    content =
      `**Hey there, ${interaction.user}! 👋 **\n\n` +
      `**We noticed that your account hadn't been verified yet. To get started with our awesome Gifts of Eden loyalty program, use the */verify* command to verify your account. 🔓**\n\n` +
      `**Once you're verified, you can start boosting your loyalty score, which is currently at 0%. Use the */loyalty* command to boost your loyalty score.**\n\n` +
      `**You've earned a total of 0 points so far, but by checking out all the tasks available to earn points, you'll be on your way to racking up that score in no time. Just use the */quests* command to discover more! 🚀**`
  } else if (!user.twitterID || !user.walletAddress) {
    content =
      `**Hey there, ${interaction.user}! 👋 **\n\n` +
      `**We noticed that your account is just partially verified. To get started with our awesome Gifts of Eden loyalty program, use the */verify* command to verify your account. 🔓**\n\n` +
      `**Once you're verified, you can start boosting your loyalty score, which is currently at 0%. Don't worry, there are plenty of tasks to help you increase it! 🌟**\n\n` +
      `**You've earned a total of 0 points so far, but by checking out all the tasks available to earn points, you'll be on your way to racking up that score in no time. Just use the */quests* command to discover more! 🚀**\n\n` +
      `**Don't forget to verify your account and dive into these tasks to start earning points and boosting your loyalty score! 💪**`
  } else {
    content =
      `**Hey there, ${interaction.user}! 👋 **\n\n` +
      `**Congratulations your account is verified! 🎉 You're all set to enjoy the benefits of our Gifts of Eden.**\n\n` +
      `**Your current loyalty score is ${profile.loyaltyWeight * 100}%. If you haven't completed all the loyalty tasks yet, be sure to finish them to boost your loyalty even more! 🚀**\n\n` +
      `**You've earned a total of ${profile.totalPoints} points so far. Remember, you can always check all the tasks available to earn points using the */quests* command. Keep up the great work! 💪**\n\n` +
      `**Continue exploring these tasks to earn more points and boost your loyalty score even further! 💖**`
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

  const collector = interaction.channel?.createMessageComponentCollector({
    componentType: "SELECT_MENU",
  });

  collector?.on("collect", async (collected) => {
    let msg;
    const value = collected.values[0] as LoyaltyTaskType;
    const taskResponse = await completeLoyaltyTask(profile, value);

    if (value === "twitter_profile")
      msg = `Looking fresh with that NFT profile pic!`;

    await sendFeedDiscord(`${collected?.user}, ${msg}`);
    await collected.reply({
      content: `${collected?.user}, ${taskResponse}`,
      ephemeral: true,
    });
  });
};
