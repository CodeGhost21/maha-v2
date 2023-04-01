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
    interaction.user,
    guildId
  );

  const allLoyalties = await LoyaltyTask.find({
    organizationId: profile.organizationId,
  });

  // process the /loyalty command
  let loyaltyMsg: string;

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

  const score = (profile.loyaltyWeight * 100).toFixed(2);

  if (profile.loyaltyWeight === 1) {
    loyaltyMsg = `Congratulations 🎉! Your loyalty is now \`100%\`. You are now earning the max boost (${organization.maxBoost}x) on all your quests. Use the */quests* command to see what is you can do!`;
  } else {
    loyaltyMsg =
      `Your current loyalty score is \`${score}%\`. Complete all loyalty tasks to get a \`100%\` loyalty score and ` +
      `earn a max boost of \`${organization.maxBoost}x\` on all your points! 🚀`;
  }

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("loyalty-select")
      .setPlaceholder("View pending loyalty tasks")
      .addOptions(rowItem)
  );

  const content =
    `This is your loyalty score. It is used to represent how loyal you are to ${organization.name}. ` +
    `You can improve your loyalty score by completing loyalty tasks. The more loyalty score you have, the more` +
    ` boost you will earn. \n\n` +
    loyaltyMsg +
    "\n";

  await interaction.reply({
    content,
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

  const { profile, user } = await findOrCreateServerProfile(
    interaction.user,
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

  const value = interaction.values[0] as LoyaltyTaskType;

  try {
    const taskResponse = await completeLoyaltyTask(profile, value);
    if (!taskResponse) {
      await interaction.reply({
        content: `We could not verify this loyalty task. Please try again later.`,
        ephemeral: true,
      });
      return;
    }
  } catch (error) {
    console.log(error);
    await interaction.reply({
      content: `We could not verify this loyalty task. Please try again later.`,
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    content: `You have completed this task. Well done!`,
    ephemeral: true,
  });
};
