import nconf from 'nconf'

export const config = () => {
  return{
    production: {
      TELEGRAM_CHAT_ID: nconf.get("TELEGRAM_CHAT_ID"),
      DISCORD: {
        Borrow: nconf.get("ArthLoan_DiscordChannel"),
        Farming: nconf.get("Staking_DiscordChannel"),
        Stragies: nconf.get("Staking_DiscordChannel"),
        troveManage: nconf.get("ArthLoan_DiscordChannel"),
        mahax: nconf.get("MahaxLocks_DiscordChannel"),
        quickswap: nconf.get("BuySell_DiscordChannel"),
        curvePolygon: nconf.get("BuySell_DiscordChannel"),
        twitterMention: nconf.get("TwitterMention_Discord")
      }
    },
    staging: {
      TELEGRAM_CHAT_ID: nconf.get("Test_Tele_Chat_Id"),
      DISCORD: nconf.get("Test_DISCORD_CHANNEL_ID")
    }
  }
}
