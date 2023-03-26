import { client } from "../utils/discord";
import { executeProfileCommand } from "../controller/discord/profile";
import { executeVerifyCommand } from "../controller/discord/verify";
import { executeTasksCommand } from "../controller/discord/tasks";
import { executeLeaderboardCommand } from "../controller/discord/leaderboard";

client.once("ready", () => {
  console.log(`DISCORD: Logged in as ${client.user?.tag}!`);
  const commands = client.application?.commands;

  commands?.create({
    name: "profile",
    description: "Shows your profile for Gift of Eden",
  });

  commands?.create({
    name: "verify",
    description: "Verify you twitter and wallet",
  });

  commands?.create({
    name: "tasks",
    description: "Get your daily tasks here.",
  });

  commands?.create({
    name: "leaderboard",
    description: "View the leaderboard.",
  });
});

// Required to clean this code and make it work
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "profile") executeProfileCommand(interaction);
  else if (commandName === "verify") executeVerifyCommand(interaction);
  else if (commandName === "tasks") executeTasksCommand(interaction);
  else if (commandName === "leaderboard")
    executeLeaderboardCommand(interaction);
});
