import Twit from 'twit'
// import Twitter from 'twitter-v2'
import { TwitterApi} from 'twitter-api-v2';

import nconf from 'nconf'

import * as discord from '../output/discord'
import {config} from '../utils/config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const twitterMetions = async(mode: any) => {

  console.log("here");

  const trackWords = [
    '$MAHA',
    '@TheMahaDAO',
    '$ARTH'
  ]

  let msgTemplate: string
  const discord_channel = config().staging.DISCORD

  // const clientv1 = new TwitterApi({
  //     appKey: nconf.get("TWITTER_API_KEY"),
  //     appSecret: nconf.get("TWITTER_API_SECRET"),
  //     accessToken: nconf.get("TWITTER_ACCESS_TOKEN"),
  //     accessSecret: nconf.get("TWITTER_ACCESS_TOKEN_SECRET")
  // }).v1

  const clientv1 = new Twit({
    consumer_key: nconf.get("TWITTER_API_KEY"),
    consumer_secret: nconf.get("TWITTER_API_SECRET"),
    access_token: nconf.get("TWITTER_ACCESS_TOKEN"),
    access_token_secret: nconf.get("TWITTER_ACCESS_TOKEN_SECRET")
   })

  const clientv2 = new TwitterApi(nconf.get('BEARER_TOKEN')).v2

  const followingListMahaDAO = await clientv2.following('1246916938678169600')

  let whiteListedUsers = followingListMahaDAO.data.map(data => data.id)

  whiteListedUsers = [...whiteListedUsers, '2170763245', '1038703148293124096'].filter((id: string) => id != '767252878209744896')

  console.log('whiteListedUsers', whiteListedUsers)

//  const streamFilter = await clientv1.filterStream(
//     { track: trackWords,
//       follow: whiteListedUsers,
//       // tweet_mode: 'extended'

//     });

  const streamFilter = clientv1.stream('statuses/filter', {
    follow: whiteListedUsers,
    track: trackWords,
    tweet_mode: 'full_text'
  })

//  eslint-disable-next-line @typescript-eslint/no-explicit-any
   streamFilter
    .on('tweet', (tweet: any) => {

      if(whiteListedUsers.includes(tweet.user.id_str) &&
        (trackWords.some(word =>
          {
            if(tweet.extended_tweet){
              return tweet.extended_tweet.full_text.includes(word)
            }else{
              return tweet.text.includes(word)
            }
          }
        )
          ) &&
          !tweet.retweeted && !tweet.retweeted_status && !tweet.in_reply_to_status_id &&
          !tweet.in_reply_to_status_id_str && !tweet.in_reply_to_user_id &&
          !tweet.in_reply_to_user_id_str && !tweet.in_reply_to_screen_name
          ) {
          console.log('if tweet', tweet)
          console.log('discord_channel', discord_channel)
          msgTemplate = tweet.extended_tweet ? tweet.extended_tweet.full_text : tweet.text

          discord.sendMessage(
            mode === 'production' ? config().production.DISCORD.twitterMention : config().staging.DISCORD,
            msgTemplate,
            tweet)
        }
      else{
        console.log('not includes hence do not send')
      }
    })

}
