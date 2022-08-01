import Web3 from 'web3'
import nconf from 'nconf'

import MAHAX from '../../abi/MAHAX.json'
import * as discord from '../../output/discord'
import * as telegram from '../../output/telegram'
import { msgToBeSent } from '../../utils/msgToBeSent';
import { config } from '../../utils/config';

export default function mahaxNFT(mode: string) {

  // const testweb3 = new Web3(nconf.get('TESTNET_MATIC'))
  const web3 = new Web3(nconf.get("MAINNET_MATIC2"))

  // const testcontract = new testweb3.eth.Contract(
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   // @ts-ignore
  //   MAHAX, '0x51199eF33364775AD6D8f7dcdF00Ca2AaDADfd82')

  const contract = new web3.eth.Contract(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    MAHAX, "0x5ce7F38dFF1ff187e80A41D710f32c2Bb1bA87b7"
  )

  // console.log('mahaxNFT', contract.events)

  contract.events.allEvents()
    .on("connected", (nr: any) => console.log('MahaXNFT connected'))
    .on("data", async(data: any) => {
      console.log('data', data)
      let telegramMsg = "";
      let discordMsg = "";

      if (data.event == "Deposit"){
        telegramMsg = await msgToBeSent(data, '', '', 'mahaxnft')
        discordMsg =  await msgToBeSent(data, '', '', 'mahaxnft')

        telegram.sendMessage(
          mode === 'production' ? config().production.TELEGRAM_CHAT_ID : config().staging.TELEGRAM_CHAT_ID,
          telegramMsg
        )
        discord.sendMessage(
          mode === 'production' ? config().production.DISCORD.mahax : config().staging.DISCORD,
          discordMsg
        )
      }
      // this transfer event is used for transferFrom event but causing issue for create lock
      // if (data.event == "Transfer") {
      //   telegramMsg = await msgToBeSent(data, '', '', 'mahaxnft')
      //   discordMsg =  await msgToBeSent(data, '', '', 'mahaxnft')

      //   telegram.sendMessage(
      //     mode === 'production' ? config().production.TELEGRAM_CHAT_ID : config().staging.TELEGRAM_CHAT_ID,
      //     telegramMsg
      //   )
      //   discord.sendMessage(
      //     mode === 'production' ? config().production.DISCORD.mahax : config().staging.DISCORD,
      //     discordMsg
      //   )
      // }


    })
    .on("error", (err:any) => console.log("error", err));

}
