import { MessageEmbed } from "discord.js";

export const handleEmbedMessage = async (message: string, tweet?: any) => {
  let discordMsgEmbed: any;
  if (tweet) {
    console.log("if tweet");
    // client.user?.setUsername(user.screen_name)
    // client.user?.setAvatar(user.profile_image_url)
    discordMsgEmbed = new MessageEmbed()
      .setColor("#F07D55")
      .setTitle(
        `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
      )
      .setDescription(message)
      .setAuthor({
        name: tweet ? tweet.user.name : "",
        iconURL: tweet ? tweet.user.profile_image_url : "",
      })
      .setURL(
        `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
      )
      .setFooter({
        text: tweet ? "Twitter" : "",
        iconURL: tweet
          ? "https://i2-prod.birminghammail.co.uk/incoming/article18471307.ece/ALTERNATES/s1200c/1_Twitter-new-icon-mobile-app.jpg"
          : "",
      })
      .setTimestamp();
  } else {
    discordMsgEmbed = new MessageEmbed()
      .setColor("#F07D55")
      .setDescription(message);
  }
  const payload = { embeds: [discordMsgEmbed] };
  return payload;
};
