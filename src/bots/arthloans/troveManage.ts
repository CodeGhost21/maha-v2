
import nconf from "nconf";
import Web3 from 'web3'

import troveManagerAbi from "../../abi/TroveManager.json";
// import {troveTelegramMsg, troveDiscordMsg} from "../../utils/msgToBeSent";
import {msgToBeSent} from '../../utils/msgToBeSent'

import * as telegram from '../../output/telegram'
import * as discord from '../../output/discord'
import { config } from '../../utils/config';

// For Redeem and Liquidate

const troveContracts = [
  {
    chainName: 'Polygon Mainnet',
    chainWss: nconf.get('MAINNET_MATIC2'),
    contracts: [
      {
        poolName: 'Weth',
        poolAdrs: '0x5344950d34E8959c7fb6645C839A7cA89BE18216'
      },
      {
        poolName: 'Dai',
        poolAdrs: '0x7df27F6B3C8A2b6219352A434872DcDd8f5a50E4'
      },
      {
        poolName: 'Wmatic',
        poolAdrs: '0x8C021C5a2910D1812542D5495E4Fbf6a6c33Cb4f'
      },
      {
        poolName: 'USDCUSDT-QLP-S',
        poolAdrs: '0x2d1F24127AE8670eB9A9a36E81420fb030Ea953D'
      }
    ]
  },
  {
    chainName: 'BSC Mainnet',
    chainWss: nconf.get('MAINNET_BSC2'),
    contracts: [
      {
        poolName: 'Busd',
        poolAdrs: '0x1Beb8b4911365EabEC68459ecfe9172f174BF0DB'
      },
      {
        poolName: 'Maha',
        poolAdrs: '0xD31AC58374D4a0b3C58dFF36f2F59A22348159DB'
      },
      {
        poolName: 'Wbnb',
        poolAdrs: '0x8F2C37D2F8AE7Bce07aa79c768CC03AB0E5ae9aE'
      },
      {
        poolName: 'BUSDUSDC-APE-LP-S',
        poolAdrs: '0x21F2c7a2E91842961a66c729b96844a7c608D633'
      },
      {
        poolName: 'BUSDUSDT-APE-LP-S',
        poolAdrs: '0x7A535496c5a0eF6A9B014A01e1aB9d7493F503ea'
      },
    ]
  }
]

// For Redeem and Liquidate
const troveManage = (mode: any) => {

  troveContracts.map((troveContract) => {
    troveContract.contracts.map((adrs) => {
      new (new Web3(troveContract.chainWss)).eth.Contract(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        troveManagerAbi, adrs.poolAdrs).events.allEvents()
        .on('connected', (nr:any) => console.log(`connected trove ${troveContract.chainName} ${adrs.poolName}`))
        .on('data', async(event:any) => {

          console.log('troveManagerContract', event)
          let telegramMsg = ''
          let discordMsg = ''

          if(event.event == 'TroveLiquidated' || event.event == 'Redemption'){
            telegramMsg = await msgToBeSent(event, troveContract.chainName, adrs.poolName)
            discordMsg = await msgToBeSent(event, troveContract.chainName, adrs.poolName)

            telegram.sendMessage(
              mode === 'production' ? config().production.TELEGRAM_CHAT_ID : config().staging.TELEGRAM_CHAT_ID,
              telegramMsg
            )
            discord.sendMessage(
              mode === 'production' ? config().production.DISCORD.troveManage : config().staging.DISCORD,
              discordMsg
            )
          }



        })
    })
  })

}

export default troveManage
