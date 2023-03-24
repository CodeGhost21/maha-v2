import nconf from "nconf";
import {
  Client,
  Intents,
  TextChannel,
  MessageOptions,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
} from "discord.js";
import DiscordOauth2 from "discord-oauth2";

import { IUserModel, User } from "../database/models/user";
import * as jwt from "jsonwebtoken";
import urlJoin from "./urlJoin";
import { Organization } from "../database/models/organisation";

const jwtSecret = nconf.get("JWT_SECRET");
const total_icons = [
  "🥇",
  "🥈",
  "🥉",
  "🎉",
  "🎉",
  "🤲",
  "🤲",
  "🤲",
  "🤲",
  "🤲",
  "❌",
  "✅",
  "🔥",
  "✋",
];
let commands;

const row = new MessageActionRow().addComponents(
  new MessageSelectMenu()
    .setCustomId("taskSelect")
    .setPlaceholder("Select a task")
    .addOptions([
      {
        label: "First",
        description: "First",
        value: "First",
      },
      {
        label: "Second",
        description: "Second",
        value: "Second",
      },
      {
        label: "Third",
        description: "Third",
        value: "Third",
      },
    ])
);

export const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  ],
});

client.login(nconf.get("DISCORD_CLIENT_TOKEN")); //login bot using token

client.once("ready", () => {
  console.log(`DISCORD: Logged in as ${client.user?.tag}!`);
  const guild = client.guilds.cache.get(nconf.get("DISCORD_GUILD_ID"));

  if (guild) {
    commands = guild.commands;
  } else {
    commands = client.application?.commands;
  }

  commands?.create({
    name: "profile",
    description: "Shows your profile for Gift of Eden",
  });
  // commands?.create({
  //   name: "tasks",
  //   description: "Shows your loyalty tasks status",
  // });
  commands?.create({
    name: "verify",
    description: "Verify you twitter and wallet",
  });
  commands?.create({
    name: "dropdown",
    description: "Dropdown list for tasks",
  });
});

// Required to clean this code and make it work
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "profile") {
    await User.findOne({ userID: interaction.user.id }).then(async (user) => {
      if (user) {
        // const userLoyalty = await user.getLoyalty();

        await interaction.reply({
          content:
            `Hello ${user.discordName}${total_icons[13]} \n\n` +
            `Total points earned: ${user.totalPoints}\n` +
            // `Current Loyalty Completed: ${userLoyalty.totalLoyalty}%\n\n` +
            `Your current GM rank: ${user.gmRank}${total_icons[3]}\n` +
            `Total number of GM said: ${user.totalGMs}\n` +
            `Highest GM Streak Record: ${user.maxStreak}\n` +
            `Twitter Verify: ${
              user.signTwitter
                ? `Completed!!${total_icons[11]}`
                : `Pending${total_icons[10]}`
            }\n` +
            `Wallet Connected: ${
              user.walletAddress
                ? `Completed!!${total_icons[11]}`
                : `Pending${total_icons[10]}`
            }\n`,
        });
      }
    });
  } else if (commandName === "tasks") {
    await User.findOne({ userID: interaction.user.id }).then(async (user) => {
      // const userLoyalty = await user?.getLoyalty();

      await interaction.reply({
        // content: `Loyalty Tasks${total_icons[5]} \n\n` +
        //   `Say GM: ${userLoyalty?.gm ? `Completed!!${total_icons[11]}` : `Pending${total_icons[10]}`}\n` +
        //   `Change Twitter Profile: ${userLoyalty?.twitterProfile ? `Completed!!${total_icons[11]}` : `Pending${total_icons[10]}`}\n` +
        //   `Change Discord Profile: ${userLoyalty?.discordProfile ? `Completed!!${total_icons[11]}` : `Pending${total_icons[10]}`}\n` +
        //   `Revoke Opensea Access: ${userLoyalty?.opensea ? `Completed!!${total_icons[11]}` : `Pending${total_icons[10]}`}\n`,
        // ephemeral: true
      });
    });
  } else if (commandName === "verify") {
    const expiry = Date.now() + 86400000 * 7;

    await User.findOne({ userID: interaction.user.id }).then(async (user) => {
      const token = await jwt.sign({ id: user?.id, expiry }, jwtSecret);
      const frontendUrl = urlJoin(
        nconf.get("FRONTEND_URL"),
        `/verify?token=${token}`
      );
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("Verify Twitter")
          .setStyle("LINK")
          .setURL(urlJoin(frontendUrl, `&type=twitter`)),

        new MessageButton()
          .setLabel("Verify Wallet")
          .setStyle("LINK")
          .setURL(urlJoin(frontendUrl, `&type=wallet&_id=${user?._id}`))
      );

      const discordMsgEmbed = new MessageEmbed()
        .setColor("#F07D55")
        .setDescription("Verify yourself by clicking below");

      const discordSuccessEmbed = new MessageEmbed()
        .setColor("#4ffa02")
        .setDescription("You have been successfully verified.");

      if (!user?.signTwitter && !user?.walletAddress) {
        await interaction.reply({
          embeds: [discordMsgEmbed],
          components: [row],
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          embeds: [discordSuccessEmbed],
          ephemeral: true,
        });
      }
    });
  } else if (commandName === "dropdown") {
    const embed = new MessageEmbed()
      .setTitle("Welcome to task selector")
      .setColor("GREEN");

    await interaction.reply({
      content: " ",
      ephemeral: true,
      embeds: [embed],
      components: [row],
    });

    const embed1 = new MessageEmbed()
      .setTitle("Selected option 1")
      .setColor("GREEN");

    const embed2 = new MessageEmbed()
      .setTitle("Selected option 2")
      .setColor("GREEN");

    const embed3 = new MessageEmbed()
      .setTitle("Selected option 3")
      .setColor("GREEN");

    const collector = interaction.channel?.createMessageComponentCollector({
      componentType: "SELECT_MENU",
    });

    collector?.on("collect", async (collected: any) => {
      const value = collected.values[0];

      if (value === "First") {
        collected.reply({ embeds: [embed1], ephemeral: true });
      } else if (value === "Second") {
        collected.reply({ embeds: [embed2], ephemeral: true });
      } else if (value === "Third") {
        collected.reply({ embeds: [embed3], ephemeral: true });
      }
    });
  }
});

//This listener is for user joining the guild
client.on("guildMemberAdd", async (member) => {
  const organization = await Organization.findOne({ guildId: member.guild.id });
  if (organization) {
    if (!member.user.bot) {
      const newUser = new User({
        userTag: member.user.username + "#" + member.user.discriminator,
        userID: member.user.id,
        discordName: member.user.username,
        discordAvatar: member.user.avatar,
        discordDiscriminator: member.user.discriminator,
        organizationId: organization.id,
      });
      await newUser.save();
    }
  }
});

export const sendMessage = (
  channelName: string,
  messageMarkdown?: MessageOptions | string
) => {
  if (!messageMarkdown) return;
  const channel = client.channels.cache.get(channelName);
  (channel as TextChannel).send(messageMarkdown);
};

export const checkGuildMember = async (memberId: string) => {
  const guild = await client.guilds.fetch(nconf.get("DISCORD_GUILD_ID"));
  try {
    const response = await guild.members.fetch(memberId);
    return !!response.user;
  } catch (e) {
    return false;
  }
};

export const fetchDiscordAvatar = async (user: IUserModel) => {
  const oauth = new DiscordOauth2();
  const response = await oauth.getUser(user.discordOauthAccessToken);
  return response.avatar;
};
