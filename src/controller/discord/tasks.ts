import {
  CacheType,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
} from "discord.js";

import { findOrCreateServerProfile } from "../../database/models/serverProfile";
import { Task } from "../../database/models/tasks";

export const executeTasksCommand = async (
  interaction: CommandInteraction<CacheType>
) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const { organization } = await findOrCreateServerProfile(
    interaction.user.id,
    guildId
  );

  const content: string =
    `**Hey there, ${interaction.user}** \n\n` +
    `**Are you ready to explore the tasks available in our Gifts of Eden loyalty program? Check out the list below and start earning points! 💪**\n\n` +
    `Happy task hunting, and let's keep growing together! 🌱💖`;

  const allTasks = await Task.find({ organizationId: organization?.id });
  const rowItem = allTasks.map((item) => ({
    label: item.name,
    value: item.type,
  }));

  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId("taskSelect")
      .setPlaceholder("Select a task")
      .addOptions(rowItem)
  );



  if (rowItem.length < 1) {
    await interaction.reply({
      content: "No quests have been created yet.",
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: content,
      ephemeral: true,
      components: [row],
    });
  }

  const taskCollector = interaction.channel?.createMessageComponentCollector({
    componentType: "SELECT_MENU",
  });

  taskCollector?.on("collect", async (collected: any) => {
    let msg;
    const value = collected.values[0];
    if (value === "gm") {
      msg = `Go and say GM in the GM channel`;
      await collected.reply({
        content: `Hey ${collected?.user}, ${msg}`,
        ephemeral: true,
      });
    } else if (value === "twitter_follow") {
      msg = `Follow the MAHADAO twitter page and earn points daily.`
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("Follow @MAHADAO")
          .setStyle("LINK")
          .setURL('https://twitter.com/TheMahaDAO'),
      );
      await collected.reply({
        content: `Hey ${collected?.user}, ${msg}`,
        ephemeral: true,
        components: [row],
      });
    } else if (value === 'hold_nft') {
      msg = `You have to hold a citizenship and you would earn points daily.`;
      await collected.reply({
        content: `Hey ${collected?.user}, ${msg}`,
        ephemeral: true,
      });
    } else {
      msg = `Task failed! Please check and try again later.`;
      await collected.reply({
        content: `Hey ${collected?.user}, ${msg}`,
        ephemeral: true,
      });
    }

  });
};
