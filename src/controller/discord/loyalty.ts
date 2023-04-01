import {
  CacheType,
  CommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ButtonInteraction,
} from "discord.js";

import {
  LoyaltyTask,
  LoyaltyTaskType,
} from "../../database/models/loyaltyTasks";
import { findOrCreateServerProfile } from "../../database/models/serverProfile";
import { sendFeedDiscord } from "../../utils/sendFeedDiscord";
import { completeLoyaltyTask } from "../loyaltyTask";

export const executeLoyaltyCommand = async (
  interaction: CommandInteraction<CacheType> | ButtonInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { profile, organization } = await findOrCreateServerProfile(
    interaction.user.id,
    guildId
  );

  const allLoyalties = await LoyaltyTask.find({
    organizationId: profile.organizationId,
  });

  // process the /loyalty command
  let content: string;

  if (allLoyalties.length === 0) {
    await interaction.reply({
      content: "No loyalty tasks have been created yet.",
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

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
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
};

// step 2. when the user clicks on the dropdown menu; shoot out the loyalty tasks
export const executeLoyaltySelectInput = async (
  interaction: StringSelectMenuInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { profile, user, organization } = await findOrCreateServerProfile(
    interaction.user.id,
    guildId
  );

  if (!user.twitterID || !user.walletAddress) {
    const toVerify = [];
    if (!user.twitterID) toVerify.push("Twitter");
    if (!user.walletAddress) toVerify.push("Wallet");

    await interaction.reply({
      content: `Your ${toVerify.join(
        " and "
      )} is not yet verified. Verify using \`/verify\` to complete this loyalty task.`,
      ephemeral: true,
    });
    return;
  }

  let msg;
  const value = interaction.values[0] as LoyaltyTaskType;

  const taskResponse = await completeLoyaltyTask(profile, value);

  if (!taskResponse) {
    await interaction.reply({
      content: `We could not verify this loyalty task. Please try again later.`,
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
};
