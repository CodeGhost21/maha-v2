import { client } from "../utils/discord";
import { executeProfileCommand } from "../controller/discord/profile";
import { executeVerifyCommand } from "../controller/discord/verify";
import {
  executeTasksCommand,
  executeTaskSelectInput,
} from "../controller/discord/tasks";
import { executeLeaderboardCommand } from "../controller/discord/leaderboard";
import { executeSetupCommand } from "../controller/discord/setup";
import {
  executeLoyaltyCommand,
  executeLoyaltySelectInput,
} from "../controller/discord/loyalty";
import { Events } from "discord.js";
import { Organization } from "../database/models/organization";
import { executeGMstatement } from "../controller/task/gm";
import { User } from "../database/models/user";

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

client.on(Events.InteractionCreate, async (interaction) => {
  const user = await User.findOne({ discordId: interaction.user.id });

  if (user) {
    user.discordName = interaction.user.username;
    user.discordDiscriminator = interaction.user.discriminator;
    user.discordAvatar = interaction.user.avatar || "";
    user.discordTag = `${interaction.user.username}#${interaction.user.discriminator}`;

    await user.save();
  }
  // slash commands
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    if (commandName === "profile") executeProfileCommand(interaction);
    if (commandName === "verify") executeVerifyCommand(interaction);
    if (commandName === "quests") executeTasksCommand(interaction);
    if (commandName === "leaderboard") executeLeaderboardCommand(interaction);
    if (commandName === "setup") executeSetupCommand(interaction);
    if (commandName === "loyalty") executeLoyaltyCommand(interaction);
  }

  // dropdown
  if (interaction.isStringSelectMenu()) {
    const { customId } = interaction;
    if (customId === "task-select") executeTaskSelectInput(interaction);
    if (customId === "loyalty-select") executeLoyaltySelectInput(interaction);
  }

  // button checks
  if (interaction.isButton()) {
    const { customId } = interaction;
    if (customId === "quests") executeTasksCommand(interaction);
    if (customId === "verify") executeVerifyCommand(interaction);
    if (customId === "loyalty") executeLoyaltyCommand(interaction);
  }

  if (interaction.isModalSubmit()) {
    console.log(interaction)
  }
});

client.on(Events.MessageCreate, async (message) => {
  const guildId = message.guildId;

  if (!guildId) return;
  if (message.author.bot) return;

  const org = await Organization.findOne({ guildId });
  if (!org) return;

  // make sure we are in the gm chat
  if (message.channelId !== org.gmChannelId) return;

  try {
    await executeGMstatement(guildId, message);
  } catch (error) {
    console.log(error);
    // todo capture on sentry
  }
});

client.on("error", (e) => console.error(e)); // todo use sentry
// client.on("warn", (e) => console.warn(e));
// client.on("debug", (e) => console.info(e));
