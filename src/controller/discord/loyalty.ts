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

export const executeLoyaltyCommand = async (
  interaction: CommandInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { profile } = await findOrCreateServerProfile(
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

  if (profile.loyaltyWeight === 1) {
    content = `**Congratulations your loyalty is 100%! 🎉 You're all set to enjoy the max boost on the tasks you perform. Just use the */quests* command to discover more! **`
  } else {
    content = `Your current loyalty score is ${profile.loyaltyWeight * 100}%. If you haven't completed all the loyalty tasks yet, be sure to finish them to boost your loyalty score even more! 🚀`
  }

  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId("taskSelect")
      .setPlaceholder("Select a task")
      .addOptions(rowItem)
  );

  if (rowItem.length < 1) {
    await interaction.reply({
      content: "No loyalty tasks have been created yet.",
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: content,
      components: [row],
      ephemeral: true,
    });
  }

  const collector = interaction.channel?.createMessageComponentCollector({
    componentType: "SELECT_MENU",
  });

  collector?.on("collect", async (collected) => {
    let msg, botMsg;
    const value = collected.values[0] as LoyaltyTaskType;
    const taskResponse = await completeLoyaltyTask(profile, value);

    if (taskResponse) botMsg = `Task completed successfully.`;
    else botMsg = `Task failed! Please check and try again later.`

    if (value === "twitter_profile") msg = `Looking fresh with that NFT profile pic!`;
    else if (value === "discord_profile") msg = `Rocking with that NFT Profile pic!`;
    else if (value === "gm") msg = `Early Bird!!`;
    else msg = `is a Keeper!!`

    await sendFeedDiscord(`${collected?.user}, ${msg}`);
    await collected.reply({
      content: `${collected?.user}, ${botMsg}`,
      ephemeral: true,
    });
  });
};
