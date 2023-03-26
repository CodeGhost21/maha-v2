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
import { findOrCreateWithDiscordId } from "../../database/models/serverProfile";
import { sendFeedDiscord } from "../../utils/sendFeedDiscord";
import { completeLoyaltyTask } from "../loyaltyTask";

export const executeProfileCommand = async (
  interaction: CommandInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { profile, user } = await findOrCreateWithDiscordId(
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

  if (!user.twitterID || !user.walletAddress) {
    content =
      `Hello ${interaction.user} 🤲 \n\n` +
      `***Seems like you have not verified your Twitter and wallet. Verify yourself using /verify command and you will get perform the amazing tasks.***\n\n` +
      `Total points earned: ${profile.totalPoints}\n` +
      `Current Loyalty Completed: 0%\n\n` +
      `Highest GM Streak Record: ${profile.maxStreak}\n` +
      `Twitter Verify: ${user.twitterID ? `Completed!! 🚀` : `Pending ❌`}\n` +
      `Wallet Connected: ${
        user.walletAddress ? `Completed!!🚀` : `Pending ❌`
      }\n`;
  } else {
    content =
      `Hello ${interaction.user}🤲 \n\n` +
      `***You have earned ${
        profile.loyaltyWeight * 100
      }% loyalty which will boost your points by 10x and you have earned a total of ${
        profile.totalPoints
      } points*** \n` +
      `***hey good going you have ${profile.maxStreak} days of gm streak 😮, keep going*** \n\n` +
      `Your Wallet and Twitter both are verified 🥳 \n\n` +
      `**Loyalty Tasks**`;
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
