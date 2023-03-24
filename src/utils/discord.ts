import { LoyaltyTask } from "./../database/models/loyaltyTasks";
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
import { completeLoyaltyTask } from "../controller/loyaltyTask";
import { sendFeedDiscord } from "./sendFeedDiscord";
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

  commands?.create({
    name: "verify",
    description: "Verify you twitter and wallet",
  });
});

// Required to clean this code and make it work
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === "profile") {
      await User.findOne({ userID: interaction.user.id }).then(async (user) => {
        if (user) {
          let content: string;

          const organization = await Organization.findOne({
            guildId: interaction.guild?.id,
          });
          const allLoyalties = await LoyaltyTask.find({
            organizationId: organization?.id,
          });
          const rowItem: any[] = [];
          allLoyalties.map((item) => {
            rowItem.push({
              label: item.name,
              description: "description",
              value: item.type,
            });
          });

          const row = new MessageActionRow().addComponents(
            new MessageSelectMenu()
              .setCustomId("taskSelect")
              .setPlaceholder("Select a task")
              .addOptions(rowItem)
          );

          if (!user?.signTwitter || !user?.walletAddress) {
            content =
              `Hello ${interaction.user}${total_icons[13]} \n\n` +
              `***Please verify yourself by typing /verify command***\n\n` +
              `Total points earned: ${user.totalPoints}\n` +
              `Current Loyalty Completed: 0%\n\n` +
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
              }\n`;
          } else {
            content =
              `Hello ${interaction.user}${total_icons[13]} \n\n` +
              `***You have earned ${
                user.loyaltyWeight * 100
              }% loyalty which will boost your points by 10x and you have earned a total of ${
                user.totalPoints
              } points*** \n` +
              `***hey good going you have ${user.maxStreak} days of gm streak 😮, keep going*** \n\n` +
              `Your Wallet and Twitter both are verified 🥳 \n\n` +
              `Loyalty Tasks`;

            // `Total points earned: ${user.totalPoints}\n` +
            // `Your current GM rank: ${user.gmRank}${total_icons[3]}\n` +
            // `Total number of GM said: ${user.totalGMs}\n` +
            // `Highest GM Streak Record: ${user.maxStreak}\n` +
            // `Twitter Verify: ${user.signTwitter
            //   ? `Completed!!${total_icons[11]}`
            //   : `Pending${total_icons[10]}`
            // }\n` +
            // `Wallet Connected: ${user.walletAddress
            //   ? `Completed!!${total_icons[11]}`
            //   : `Pending${total_icons[10]}`
            // }\n`
          }

          if (
            !user?.signTwitter ||
            !user?.walletAddress ||
            rowItem.length < 1
          ) {
            await interaction.reply({
              content: content,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: content,
              ephemeral: true,
              components: [row],
            });
          }

          const collector =
            interaction.channel?.createMessageComponentCollector({
              componentType: "SELECT_MENU",
            });

          collector?.on("collect", async (collected: any) => {
            let msg;
            const value = collected.values[0];
            const taskResponse = await completeLoyaltyTask(
              interaction.user.id,
              value
            );
            if (value === "twitter_profile") {
              msg = `Looking fresh with that NFT profile pic!`;
            }
            await sendFeedDiscord(`${collected?.user}, ${msg}`);
            // await collected.reply({ content: `${collected?.user}, ${taskResponse}`, ephemeral: true })
          });
        }
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
            .setDisabled(user?.signTwitter)
            .setURL(urlJoin(frontendUrl, `&type=twitter`)),

          new MessageButton()
            .setLabel("Verify Wallet")
            .setStyle("LINK")
            .setDisabled(!!user?.walletAddress)
            .setURL(urlJoin(frontendUrl, `&type=wallet&_id=${user?._id}`))
        );

        const discordMsgEmbed = new MessageEmbed()
          .setColor("#F07D55")
          .setThumbnail("https://i.imgur.com/AfFp7pu.png")
          .setAuthor({
            name: "Gift of Eden",
            iconURL: "https://i.imgur.com/AfFp7pu.png",
            url: "https://discord.js.org",
          })
          .setTitle("Title here")
          .setDescription(
            "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,"
          );

        const discordSuccessEmbed = new MessageEmbed()
          .setColor("#4ffa02")
          .setDescription("You have been successfully verified.");

        if (!user?.signTwitter || !user?.walletAddress) {
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
    }
  } catch (error) {
    console.error(error);
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
