import nconf from "nconf";
import { Client, Intents, MessageEmbed, TextChannel} from "discord.js";

// For MAHA Notification app
export const clientMaha = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
  ],
});

clientMaha.on("ready", () =>
  console.log(`DISCORD: Logged in as ${clientMaha.user?.tag}!`)

);

clientMaha.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName == "maha") await interaction.reply("DAO!");
});

clientMaha.on("messageCreate", (msg) => {
  if (msg.content.toLowerCase() == "maha") msg.channel.send("DAO");
});

export const clientTwitter = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
  ],
});

clientTwitter.on("ready", () =>
  console.log(`DISCORD: Logged in as ${clientTwitter.user?.tag}!`)

);

clientTwitter.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName == "maha") await interaction.reply("DAO!");
});

clientTwitter.on("messageCreate", (msg) => {
  if (msg.content.toLowerCase() == "maha") msg.channel.send("DAO");
});


const DISCORD_TOKEN_MAHA = nconf.get('MAHA_DiscordClientToken') // for production
// const DISCORD_TOKEN_MAHA = nconf.get('Test_DISCORD_TOKEN') // for testing
const DISCORD_TOKEN_TWITTER = nconf.get('TweetMentionDiscordClientToken')

clientMaha.login(DISCORD_TOKEN_MAHA); //login bot using token
clientTwitter.login(DISCORD_TOKEN_TWITTER)

export const sendMessage = (channelName: any, messageMarkdown: string, tweet?: any) => {
  
  let discordMsgEmbed: any
  if(tweet){

    const channelMaha = clientMaha.channels.cache.get(channelName);


    console.log('if tweet')
    // client.user?.setUsername(user.screen_name)
    // client.user?.setAvatar(user.profile_image_url)
    discordMsgEmbed = new MessageEmbed()
      .setColor("#F07D55")
      .setTitle(`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
      .setDescription(messageMarkdown)
      .setAuthor({
        name: tweet ? tweet.user.name : '',
        iconURL: tweet ? tweet.user.profile_image_url : ''
      })
      .setURL(`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
      .setFooter({
        text: tweet ?'Twitter' : '',
        iconURL: tweet ?  'https://i2-prod.birminghammail.co.uk/incoming/article18471307.ece/ALTERNATES/s1200c/1_Twitter-new-icon-mobile-app.jpg' : ''
      })
      .setTimestamp()

    if (channelMaha) (channelMaha as TextChannel).send({ embeds: [discordMsgEmbed] });

  }
  else{

    // clientMaha.user?.setUsername('Maha')

    const channelTwitter = clientMaha.channels.cache.get(channelName);


    discordMsgEmbed = new MessageEmbed()
      .setColor("#F07D55")
      .setDescription(messageMarkdown)

  
    if (channelTwitter) (channelTwitter as TextChannel).send({ embeds: [discordMsgEmbed] });

  }

};
