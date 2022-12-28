import Web3 from 'web3'
import nconf from 'nconf'

import MAHAX from '../../abi/MAHAX.json'
import * as discord from '../../output/discord'
import * as telegram from '../../output/telegram'
import { msgToBeSent } from '../../utils/msgToBeSent';
import { config } from '../../utils/config';


export default function mahaxNFT(mode: string) {

  const nftContracts = [
    {
      chainName: "Ethereum",
      chainWss: nconf.get('MAINNET_ETH'),
      contract: {
        address: "0xbdD8F4dAF71C2cB16ccE7e54BB81ef3cfcF5AAcb"
      }
    },
    // {
    //   chainName: "Rinkeby",
    //   chainWss: nconf.get('WSS_RINKEBY'),
    //   contract: {
    //     address: "0xCb3f67601f122190f2F6aE2ce1262cfb8e6361C4"

    //   }
    // },
    // {
    //   chainName: "Polygon Mainnet",
    //   chainWss: nconf.get("MAINNET_MATIC"),
    //   contract: [
    //     {
    //       address: "0x5ce7F38dFF1ff187e80A41D710f32c2Bb1bA87b7"
    //     }
    //   ]
    // }
  ]

  // const web3 = new Web3(nconf.get('WSS_RINKEBY'))
  // const contract = new web3.eth.Contract(
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   // @ts-ignore
  //   MAHAX, '0xCb3f67601f122190f2F6aE2ce1262cfb8e6361C4')



  // const web3 = new Web3(nconf.get("MAINNET_MATIC"))
  // const contract = new web3.eth.Contract(
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   // @ts-ignore
  //   MAHAX, "0x5ce7F38dFF1ff187e80A41D710f32c2Bb1bA87b7"
  // )


  nftContracts.map((nft: any) => {
    const web3 = new Web3(nft.chainWss)

    const contract = new web3.eth.Contract(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
      MAHAX, nft.contract.address
    )

    contract.events.allEvents()
      .on("connected", (nr: any) => console.log('MahaXNFT connected'))
      .on("data", async(data: any) => {
        console.log('data', data)
        let telegramMsg = "";
        let discordMsg = "";

        if (data.event == "Deposit"){
          telegramMsg = await msgToBeSent(data, nft.chainName, '', 'mahaxnft')
          discordMsg =  await msgToBeSent(data, nft.chainName, '', 'mahaxnft')


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
        if (data.event == "Transfer" && data.returnValues.from !== '0x0000000000000000000000000000000000000000') {
          telegramMsg = await msgToBeSent(data, nft.chainName, '', 'mahaxnft')
          discordMsg =  await msgToBeSent(data, nft.chainName, '', 'mahaxnft')

          telegram.sendMessage(
            mode === 'production' ? config().production.TELEGRAM_CHAT_ID : config().staging.TELEGRAM_CHAT_ID,
            telegramMsg
          )
          discord.sendMessage(
            mode === 'production' ? config().production.DISCORD.mahax : config().staging.DISCORD,
            discordMsg
          )
        }

        if (data.event == "Withdraw") {
          telegramMsg = await msgToBeSent(data, nft.chainName, '', 'mahaxnft')
          discordMsg =  await msgToBeSent(data, nft.chainName, '', 'mahaxnft')

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
      .on("error", (err:any) => console.log("error", err));


  })


}
