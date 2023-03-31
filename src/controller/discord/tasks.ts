import {
  CacheType,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js";

import { findOrCreateServerProfile } from "../../database/models/serverProfile";
import { Task } from "../../database/models/tasks";

export const executeTasksCommand = async (
  interaction: CommandInteraction<CacheType> | SelectMenuInteraction<CacheType>
) => {
  try {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const { organization, user } = await findOrCreateServerProfile(
      interaction.user.id,
      guildId
    );
    const allTasks = await Task.find({ organizationId: organization?.id });
    const rowItem = allTasks.map((item) => ({
      label: item.name,
      value: item.type,
    }));

    if (interaction.isCommand()) {
      const content: string =
        `**Hey there, ${interaction.user}** \n\n` +
        `**Are you ready to explore the tasks available in our Gifts of Eden loyalty program? Check out the list below and start earning points! 💪**\n\n` +
        `Happy task hunting, and let's keep growing together! 🌱💖`;



      const row = new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId("task-select")
          .setPlaceholder("Select a task")
          .addOptions(rowItem)
      );

      if (rowItem.length < 1) {
        await interaction.reply({
          content: "No quests have been created yet.",
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
            ephemeral: true,
            components: [row],
          });
        }
      }

    } else if (interaction.isSelectMenu()) {
      let msg;
      const value = interaction.values[0];
      if (value === "gm") {
        msg = `Go and say GM in the GM channel`;
        await interaction?.reply({
          content: `Hey ${interaction?.user}, ${msg}`,
          ephemeral: true,
        });
      } else if (value === "twitter_follow") {
        msg = `Follow the MAHADAO twitter page and earn points daily.`;
        const row = new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel("Follow @MAHADAO")
            .setStyle("LINK")
            .setURL("https://twitter.com/TheMahaDAO")
        );
        await interaction?.reply({
          content: `Hey ${interaction?.user}, ${msg}`,
          ephemeral: true,
          components: [row],
        });
      } else if (value === "hold_nft") {
        msg = `You have to hold a citizenship and you would earn points daily.`;
        await interaction?.reply({
          content: `Hey ${interaction?.user}, ${msg}`,
          ephemeral: true,
        });
      } else {
        msg = `Task failed! Please check and try again later.`;
        await interaction?.reply({
          content: `Hey ${interaction?.user}, ${msg}`,
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error(error)
  }
};
