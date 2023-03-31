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
import { Organization } from "../../database/models/organization";
import { findOrCreateServerProfile } from "../../database/models/serverProfile";
import { sendFeedDiscord } from "../../utils/sendFeedDiscord";
import { completeLoyaltyTask } from "../loyaltyTask";

export const executeLoyaltyCommand = async (
  interaction: CommandInteraction<CacheType> | SelectMenuInteraction<CacheType>
) => {
  try {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const { profile, user } = await findOrCreateServerProfile(
      interaction.user.id,
      guildId
    );

    const allLoyalties = await LoyaltyTask.find({
      organizationId: profile.organizationId,
    });

    if (interaction.isCommand()) {

      let content: string;

      const rowItem = allLoyalties.map((item) => ({
        label: item.name,
        description: item.instruction,
        value: item.type,
      }));

      if (profile.loyaltyWeight === 1) {
        content = `**Congratulations your loyalty is 100%! 🎉 You're all set to enjoy the max boost on the tasks you perform. Just use the */quests* command to discover more! **`;
      } else {
        content = `Your current loyalty score is ${profile.loyaltyWeight * 100
          }%. If you haven't completed all the loyalty tasks yet, be sure to finish them to boost your loyalty score even more! 🚀`;
      }

      const row = new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId("loyalty-select")
          .setPlaceholder("Select a task")
          .addOptions(rowItem)
      );

      if (rowItem.length < 1) {
        await interaction.reply({
          content: "No loyalty tasks have been created yet.",
          ephemeral: true,
        });
      } else {
        if (!user.twitterID || !user.walletAddress) {
          await interaction.reply({
            content: "Verify yourself using /verify to perform any tasks.",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: content,
            components: [row],
            ephemeral: true,
          });
        }
      }
    } else if (interaction.isSelectMenu()) {
      let msg, botMsg;
      const value = interaction.values[0] as LoyaltyTaskType;
      const taskResponse = await completeLoyaltyTask(profile, value);
      if (taskResponse) {
        botMsg = `Task completed successfully.`;
        if (value === "twitter_profile")
          msg = `Looking fresh with that NFT profile pic!`;
        else if (value === "discord_profile")
          msg = `Rocking with that NFT Profile pic!`;
        else msg = `is a Keeper!!`;

        const org: any = await Organization.findOne({
          _id: profile.organizationId,
        });

        await sendFeedDiscord(org.feedChannelId, `${interaction?.user}, ${msg}`);
        await interaction.reply({
          content: `${interaction.user}, ${botMsg}`,
          ephemeral: true,
        });
      }
      else {
        botMsg = `Task failed! Please check and try again later.`
        await interaction.reply({
          content: `${interaction.user}, ${botMsg}`,
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error(error)
  }
};
