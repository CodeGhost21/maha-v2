import {
  CacheType,
  CommandInteraction,
  MessageActionRow,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js";

import {
  LoyaltyTask,
  LoyaltyTaskType,
} from "../../database/models/loyaltyTasks";
import { findOrCreateServerProfile } from "../../database/models/serverProfile";
import { sendFeedDiscord } from "../../utils/sendFeedDiscord";
import { completeLoyaltyTask } from "../loyaltyTask";

export const executeLoyaltyCommand = async (
  interaction: CommandInteraction<CacheType> | SelectMenuInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { profile, user, organization } = await findOrCreateServerProfile(
    interaction.user.id,
    guildId
  );

  const allLoyalties = await LoyaltyTask.find({
    organizationId: profile.organizationId,
  });

  // process the /loyalty command
  if (interaction.isCommand()) {
    let content: string;

    if (allLoyalties.length === 0) {
      await interaction.reply({
        content: "No loyalty tasks have been created yet.",
        ephemeral: true,
      });
      return;
    }

    if (!user.twitterID || !user.walletAddress) {
      await interaction.reply({
        content: "Verify yourself using /verify to perform any tasks.",
        ephemeral: true,
      });
      return;
    }

    const rowItem = allLoyalties.map((item) => ({
      label: item.name,
      description: item.instruction,
      value: item.type,
    }));

    if (profile.loyaltyWeight === 1) {
      content = `Congratulations 🎉! Your loyalty is now **100%**. You are now earning the max boost (${organization.maxBoost}x) on all your quests. Use the */quests* command to see what is you can do!`;
    } else {
      content = `Your current loyalty score is ${
        profile.loyaltyWeight * 100
      }%. Complete all loyalty tasks to get 100% loyalty and earn a boost on all your points! 🚀`;
    }

    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("loyalty-select")
        .setPlaceholder("View pending loyalty tasks")
        .addOptions(rowItem)
    );

    await interaction.reply({
      content: content,
      components: [row],
      ephemeral: true,
    });
    return;
  }

  // step 2. when the user clicks on the dropdown menu; shoot out the loyalty tasks
  if (interaction.isSelectMenu()) {
    let msg;
    const value = interaction.values[0] as LoyaltyTaskType;

    const taskResponse = await completeLoyaltyTask(profile, value);

    if (!taskResponse) {
      await interaction.reply({
        content: `We could not verify this task. Please try again later.`,
        ephemeral: true,
      });
      return;
    }

    if (value === "twitter_profile") msg = `updated their Twitter PFP.`;
    else if (value === "discord_profile") msg = `updated their Discord PFP.`;
    else if (value === "revoke_opensea")
      msg = `delisted their NFTs from Opensea 🤘.`;

    if (msg)
      await sendFeedDiscord(
        organization.feedChannelId,
        `<@${interaction?.user.id}> ${msg}`
      );

    await interaction.reply({
      content: `You have completed this task. Well done!`,
      ephemeral: true,
    });
  }
};
