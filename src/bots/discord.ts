import { client } from "../utils/discord";
import { executeProfileCommand } from "../controller/discord/profile";
import { executeVerifyCommand } from "../controller/discord/verify";
import { executeTasksCommand } from "../controller/discord/tasks";
import { executeLeaderboardCommand } from "../controller/discord/leaderboard";
import { executeSetupCommand } from "../controller/discord/setup";

client.once("ready", () => {
  console.log(`DISCORD: Logged in as ${client.user?.tag}!`);
  const commands = client.application?.commands;

  commands?.create({
    name: "profile",
    description: "View/Complete your profile",
  });

  commands?.create({
    name: "verify",
    description: "Verify you twitter and wallet",
  });

  commands?.create({
    name: "quests",
    description: "Complete quests and earn points!",
  });

  commands?.create({
    name: "leaderboard",
    description: "View the leaderboard. See where you stand.",
  });

  commands?.create({
    name: "setup",
    description: "Setup your server (Server owners only)",
  });
});

// Required to clean this code and make it work
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === "profile") executeProfileCommand(interaction);
    else if (commandName === "verify") executeVerifyCommand(interaction);
    else if (commandName === "quests") executeTasksCommand(interaction);
    else if (commandName === "leaderboard")
      executeLeaderboardCommand(interaction);
    else if (commandName === "setup") executeSetupCommand(interaction);
  } catch (error) {
    console.log(error);
    // TODO capture error on sentry
  }
});
