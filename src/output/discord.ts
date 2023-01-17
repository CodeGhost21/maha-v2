import nconf from "nconf";
import { Client, Intents, MessageEmbed, TextChannel } from "discord.js";

export const client = new Client({
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

client.on("ready", () =>
  console.log(`DISCORD: Logged in as ${client.user?.tag}!`)
);

client.login(nconf.get("DISCORD_CLIENT_TOKEN")); //login bot using token

export const sendMessage = (channelId: string, messageMarkdown?: string, tweet?: any) => {
  if (!messageMarkdown) return;
  const channel = client.channels.cache.get(channelId);
  let discordMsgEmbed: any

  if(tweet){
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

  }
  else{
    client.user?.setUsername('Maha')

    discordMsgEmbed = new MessageEmbed()
      .setColor("#F07D55")
      .setDescription(messageMarkdown)

  }

  console.log("sendMessage",channelId, channel, messageMarkdown);
  if (channel) (channel as TextChannel).send({ embeds: [discordMsgEmbed] });
};
