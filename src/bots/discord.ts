import { client } from "../utils/discord";
import { executeProfileCommand } from "../controller/discord/profile";
import { executeVerifyCommand } from "../controller/discord/verify";
import { executeTasksCommand } from "../controller/discord/tasks";
import { executeLeaderboardCommand } from "../controller/discord/leaderboard";
import { executeSetupCommand } from "../controller/discord/setup";
import { executeLoyaltyCommand } from "../controller/discord/loyalty";
import { MessageActionRow, MessageSelectMenu } from "discord.js";
import { MessageComponentTypes } from "discord.js/typings/enums";


client.once("ready", () => {
  console.log(`DISCORD: Logged in as ${client.user?.tag}!`);
  const commands = client.application?.commands;

  commands?.create({
    name: "profile",
    description: "View/Complete your profile",
  });

  commands?.create({
    name: "verify",
    description: "Verify you twitter/wallet and increase your loyalty.",
  });

  commands?.create({
    name: "loyalty",
    description:
      "View your loyalty score. More loyalty earns you more points for every quest.",
  });

  commands?.create({
    name: "quests",
    description: "Complete quests and earn points!",
  });

  commands?.create({
    name: "leaderboard",
    description: "View the leaderboard. See where you stand amongst others.",
  });

  commands?.create({
    name: "setup",
    description: "Setup your server (Server owners only)",
  });

  commands?.create({
    name: "test",
    description: "test",
  });
});

client.on("interactionCreate", async (interaction) => {
  console.log(interaction?.isCommand(), interaction?.isSelectMenu())

  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === "profile") executeProfileCommand(interaction);
    else if (commandName === "verify") executeVerifyCommand(interaction);
    else if (commandName === "quests") executeTasksCommand(interaction);
    else if (commandName === "leaderboard")
      executeLeaderboardCommand(interaction);
    else if (commandName === "setup") executeSetupCommand(interaction);
    else if (commandName === "loyalty") executeLoyaltyCommand(interaction);
    else if (commandName === "test") {
      // if (interaction.isCommand()) {
      const row = new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId('select')
          .setPlaceholder('Nothing selected')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions([
            {
              label: 'Select me',
              description: 'This is a description',
              value: 'first_option',
            },
            {
              label: 'You can select me too',
              description: 'This is also a description',
              value: 'second_option',
            },
            {
              label: 'I am also an option',
              description: 'This is a description as well',
              value: 'third_option',
            },
          ]));

      await interaction?.reply({ content: "Pong", components: [row], ephemeral: true });

      // }
      // else if (interaction?.isSelectMenu()) {
      //   console.log(32)
      //   if (interaction.customId === 'select') {
      //     const selected = interaction?.values[0]
      //     console.log(selected)
      //     await interaction?.reply({ content: selected, ephemeral: true })
      //   }
      // }

      // const taskCollector = interaction.channel?.createMessageComponentCollector({
      //   componentType: MessageComponentTypes.SELECT_MENU,
      // })

      // taskCollector?.on('collect', async(collected) => {
      //   console.log((collected));
      // })


    }
  } catch (error) {
    console.log(error);
    // TODO capture error on sentry
  }
});

client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
client.on("debug", (e) => console.info(e));
