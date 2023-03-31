import { MessageActionRow, MessageSelectMenu } from "discord.js";
import { client } from "../utils/discord";
import { executeProfileCommand } from "../controller/discord/profile";
import { executeVerifyCommand } from "../controller/discord/verify";
import { executeTasksCommand } from "../controller/discord/tasks";
import { executeLeaderboardCommand } from "../controller/discord/leaderboard";
import { executeSetupCommand } from "../controller/discord/setup";
import { executeLoyaltyCommand } from "../controller/discord/loyalty";

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
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    if (commandName === "profile") executeProfileCommand(interaction);
    else if (commandName === "verify") executeVerifyCommand(interaction);
    else if (commandName === "quests") executeTasksCommand(interaction);
    else if (commandName === "leaderboard")
      executeLeaderboardCommand(interaction);
    else if (commandName === "setup") executeSetupCommand(interaction);
    else if (commandName === "loyalty") executeLoyaltyCommand(interaction);
  } else if (interaction.isSelectMenu()) {
    const { customId } = interaction;
    if (customId === "profile-loyalty") executeProfileCommand(interaction);
    else if (customId === "task-select") executeTasksCommand(interaction);
    else if (customId === "loyalty-select") executeLoyaltyCommand(interaction);
  }
});

// client.on("error", (e) => console.error(e));
// client.on("warn", (e) => console.warn(e));
// client.on("debug", (e) => console.info(e));
