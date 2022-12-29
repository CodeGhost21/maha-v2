import Web3 from 'web3'

import {msgToBeSent} from '../utils/msgToBeSent'
import {config} from '../utils/config'
import * as telegram from '../output/telegram'
import * as discord from '../output/discord'
import FantomLock from '../abi/FantomLock.json'
import FantomVote from '../abi/FantomVote.json'

const fantomAdrs = [
  {
    contractAdrs: '0xcbd8fea77c2452255f59743f55a3ea9d83b3c72b',
    eventName: 'lock',
  },
  {
    contractAdrs: '0xdc819f5d05a6859d2facbb4a44e5ab105762dbae',
    eventName: 'castVote'
  }
]

const fantomNotify = (mode: any) => {


  fantomAdrs.map((cont: any) => {
    const web3 = new Web3('wss://wsapi.fantom.network')

    let abi: any
    console.log('cont', cont)
    if(cont.eventName === 'lock') abi = FantomLock
    if(cont.eventName === 'castVote') abi =FantomVote
    const contract = new web3.eth.Contract(abi, cont.contractAdrs)
    console.log('contract.events', contract.events)
    contract.events.allEvents()
      .on('connected', () => console.log('connected to fantom'))
      .on('data', async(event: any) => {
        console.log('fantom event', event)
        let telegramMsg = "";
        let discordMsg = "";

        if(event.event == 'Deposit' || event.event == 'Voted'){
          console.log('if Deposit')
          telegramMsg = await msgToBeSent(event, 'Fantom Mainnet')
          discordMsg =  await msgToBeSent(event, 'Fantom Mainnet')

          telegram.sendMessage(
            mode === 'production' ? config().production.TELEGRAM_CHAT_ID : config().staging.TELEGRAM_CHAT_ID,
            telegramMsg
          )
          discord.sendMessage(
            mode === 'production' ? config().production.DISCORD.mahax : config().staging.DISCORD,
            discordMsg
          )
        }


      })
  })

}

export default fantomNotify
