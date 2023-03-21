import nconf from "nconf";
import { Client, Intents, TextChannel, MessageOptions } from "discord.js";
import { User } from "../database/models/user";

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
  "✋"
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


client.once("ready", () => {
  console.log(`DISCORD: Logged in as ${client.user?.tag}!`)
  const guild = client.guilds.cache.get(nconf.get('DISCORD_GUILD_ID'))

  if (guild) {
    commands = guild.commands;
  } else {
    commands = client.application?.commands;
  }

  commands?.create({
    name: 'profile',
    description: 'Shows your profile for Gift of Eden',
  })
  commands?.create({
    name: 'tasks',
    description: 'Shows your loyalty tasks status',
  })
}
)

// Required to clean this code and make it work
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'profile') {

    await User.findOne({ userID: interaction.user.id }).then(async (user) => {
      if (user) {
        const userLoyalty = await user.getLoyalty();

        await interaction.reply({
          content: `Hello ${user.discordName}${total_icons[13]} \n\n` +
            `Total points earned: ${user.totalPoints}\n` +
            `Current Loyalty Completed: ${userLoyalty.totalLoyalty}%\n\n` +
            `Your current GM rank: ${user.gmRank}${total_icons[3]}\n` +
            `Total number of GM said: ${user.totalGMs}\n` +
            `Highest GM Streak Record: ${user.maxStreak}\n` +
            `Twitter Verify: ${user.signTwitter ? `Completed!!${total_icons[11]}` : `Pending${total_icons[10]}`}\n` +
            `Wallet Connected: ${user.walletAddress ? `Completed!!${total_icons[11]}` : `Pending${total_icons[10]}`}\n`,
        })
      }
    })
  } else if (commandName === 'tasks') {
    await User.findOne({ userID: interaction.user.id }).then(async (user) => {
      const userLoyalty = await user?.getLoyalty();

      await interaction.reply({
        content: `Loyalty Tasks${total_icons[5]} \n\n` +
          `Say GM: ${userLoyalty?.gm ? `Completed!!${total_icons[11]}` : `Pending${total_icons[10]}`}\n` +
          `Change Twitter Profile: ${userLoyalty?.twitterProfile ? `Completed!!${total_icons[11]}` : `Pending${total_icons[10]}`}\n` +
          `Change Discord Profile: ${userLoyalty?.discordProfile ? `Completed!!${total_icons[11]}` : `Pending${total_icons[10]}`}\n` +
          `Revoke Opensea Access: ${userLoyalty?.opensea ? `Completed!!${total_icons[11]}` : `Pending${total_icons[10]}`}\n`,
        ephemeral: true
      });
    })
  }
})

// client.on('guildMemberAdd', async (user) => {
//   let channel = user.guild.channels.cache.get(nconf.get('CHANNEL_VERIFY'))
// })

client.login(nconf.get("DISCORD_CLIENT_TOKEN")); //login bot using token

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
