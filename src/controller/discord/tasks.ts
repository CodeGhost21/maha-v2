import {
  CacheType,
  CommandInteraction,
  MessageActionRow,
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

  const allTasks = await Task.find({ organizationId: organization?.id });
  const rowItem = allTasks.map((item) => ({
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
  if (rowItem.length < 1) {
    await interaction.reply({
      content: "No quests have been created yet.",
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: "**Daily Tasks**",
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
    }
    await collected.reply({
      content: `Hey ${collected?.user}, ${msg}`,
      ephemeral: true,
    });
  });
};
