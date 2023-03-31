import { client } from "../utils/discord";
import { executeProfileCommand } from "../controller/discord/profile";
import { executeVerifyCommand } from "../controller/discord/verify";
import { executeTasksCommand } from "../controller/discord/tasks";
import { executeLeaderboardCommand } from "../controller/discord/leaderboard";
import { executeSetupCommand } from "../controller/discord/setup";
import {
  executeLoyaltyCommand,
  executeLoyaltySelectInput,
} from "../controller/discord/loyalty";

client.once("ready", () => {
  console.log(`DISCORD: Logged in as ${client.user?.tag}!`);
  const commands = client.application?.commands;

  commands?.create({
    name: "profile",
    description: "View/Complete your profile",
  });

  commands?.create({
    name: "verify",
    description:
      "Verify your profile and increase your loyalty to get a boost in points.",
  });

  commands?.create({
    name: "loyalty",
    description: "Complete loyalty tasks and earn a boost in points.",
  });

  commands?.create({
    name: "quests",
    description: "Complete quests and earn points!",
  });

  commands?.create({
    name: "leaderboard",
    description: "See where you stand amongst others.",
  });

  commands?.create({
    name: "setup",
    description: "Setup your server (admin only)",
  });
});

client.on("interactionCreate", async (interaction) => {
  // slash commands
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    if (commandName === "profile") executeProfileCommand(interaction);
    if (commandName === "verify") executeVerifyCommand(interaction);
    if (commandName === "quests") executeTasksCommand(interaction);
    if (commandName === "leaderboard") executeLeaderboardCommand(interaction);
    if (commandName === "setup") executeSetupCommand(interaction);
    if (commandName === "loyalty") executeLoyaltyCommand(interaction);

    return;
  }

  // dropdown
  if (interaction.isSelectMenu()) {
    const { customId } = interaction;

    if (customId === "profile-loyalty") executeProfileCommand(interaction);
    if (customId === "task-select") executeTasksCommand(interaction);
    if (customId === "loyalty-select") executeLoyaltySelectInput(interaction);
  }
});

// client.on("error", (e) => console.error(e));
// client.on("warn", (e) => console.warn(e));
// client.on("debug", (e) => console.info(e));
