// import { MessageEmbed, TextChannel } from "discord.js";
// import { TwitterApi } from "twitter-api-v2";
// import nconf from "nconf";
// import Twit from "twit";

// import * as discord from "../output/discord";

// export const twitterMetions = async () => {
//   const trackWords = ["$MAHA", "@TheMahaDAO", "$ARTH"];
//   // const channelName = nconf.get("CHANNEL_TWITTER_COMMUNITY");

//   const clientv1 = new Twit({
//     consumer_key: nconf.get("TWITTER_API_KEY"),
//     consumer_secret: nconf.get("TWITTER_API_SECRET"),
//     access_token: nconf.get("TWITTER_ACCESS_TOKEN"),
//     access_token_secret: nconf.get("TWITTER_ACCESS_TOKEN_SECRET"),
//   });

//   const clientv2 = new TwitterApi(nconf.get("TWITTER_BEARER_TOKEN")).v2;

//   const mahaFollowers = await clientv2.following("1246916938678169600");

// const whiteListedUsers = [
//   ...mahaFollowers.data.map((data) => data.id),
//   "2170763245", // who are these?
//   "1038703148293124096",
// ].filter((id: string) => id != "767252878209744896");

// const streamFilter = clientv1.stream("statuses/filter", {
//   follow: whiteListedUsers,
//   track: trackWords,
//   tweet_mode: "full_text",
// });

// is case sensitive?

// streamFilter.on("tweet", (tweet) => {
//   const isWhitelisted = whiteListedUsers.includes(tweet.user.id_str);

//   const hasTrackedWords = trackWords.some((word) => {
//     if (tweet.extended_tweet)
//       return tweet.extended_tweet.full_text.includes(word);
//     else return tweet.text.includes(word);
//   });

//   if (
//     !isWhitelisted ||
//     !hasTrackedWords ||
//     tweet.retweeted ||
//     tweet.retweeted_status ||
//     tweet.in_reply_to_status_id ||
//     tweet.in_reply_to_status_id_str ||
//     tweet.in_reply_to_user_id ||
//     tweet.in_reply_to_user_id_str ||
//     tweet.in_reply_to_screen_name
//   )
//     return;

//   console.log("tweet", tweet);

//   const channelMaha = discord.client.channels.cache.get(channelName);

//   const msgTemplate = tweet.extended_tweet
//     ? tweet.extended_tweet.full_text
//     : tweet.text;

//   const discordMsgEmbed = new MessageEmbed()
//     .setColor("#F07D55")
//     .setTitle(
//       `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
//     )
//     .setDescription(msgTemplate)
//     .setAuthor({
//       name: tweet ? tweet.user.name : "",
//       iconURL: tweet ? tweet.user.profile_image_url : "",
//     })
//     .setURL(
//       `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
//     )
//     .setFooter({
//       text: tweet ? "Twitter" : "",
//       iconURL: tweet
//         ? "https://i2-prod.birminghammail.co.uk/incoming/article18471307.ece/ALTERNATES/s1200c/1_Twitter-new-icon-mobile-app.jpg"
//         : "",
//     })
//     .setTimestamp();

//   if (channelMaha)
//     (channelMaha as TextChannel).send({ embeds: [discordMsgEmbed] });
// });
// };
