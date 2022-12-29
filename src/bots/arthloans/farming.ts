import nconf from "nconf";
import Web3 from 'web3'

import farmingAbi from "../../abi/BasicStaking.json";
import DotDotStaking from '../../abi/DotDotStaking.json'
import EllipsisStaking from '../../abi/EllipsisStaking.json'
import Arthu3eps from '../../abi/Arthu3eps.json'
import {msgToBeSent} from '../../utils/msgToBeSent'
import {config} from '../../utils/config'
import * as telegram from '../../output/telegram'
import * as discord from '../../output/discord'

const basicStaking = [
  {
    contrat: [
      {
        lpTokenName: "MAHA/ETH SushiSwap",
        lpTokenAdrs: '0x20257283d7B8Aa42FC00bcc3567e756De1E7BF5a',
      },
      {
        lpTokenName: "FRAX/ARTH.usd Curve",
        lpTokenAdrs: '0x7B2F31Fe97f32760c5d6A4021eeA132d44D22039',
      },
    ],
    chainWss: nconf.get('MAINNET_ETH1'),
    chainName: "Ethereum",
  },
  {
    contrat: [
      {
        lpTokenName: "ARTH.usd+3pool",
        lpTokenAdrs: '0x245AE0bBc1E31e7279F0835cE8E93127A13a3781',
      },
      {
        lpTokenName: "ARTH/USDC LP",
        lpTokenAdrs: '0xD585bfCF37db3C2507e2D44562F0Dbe2E4ec37Bc',
      },
      {
        lpTokenName: "ARTH/MAHA LP",
        lpTokenAdrs: '0xc82c95666be4e89aed8ae10bab4b714cae6655d5',
      },
    ],
    chainWss: nconf.get('MAINNET_MATIC1'),
    chainName: "Polygon Mainnet",
  },
  {
    contrat: [
      {
        lpTokenName: "ARTH/BUSD LP",
        lpTokenAdrs: '0xe8b16cab47505708a093085926560a3eb32584b8',
      },
      {
        lpTokenName: "ARTH/MAHA Ape LP",
        lpTokenAdrs: "0x1599a0A579aD3Fc86DBe6953dfEc04eb365dd8e6"
      },
      {
        lpTokenName: "ARTH/MAHA LP",
        lpTokenAdrs: '0x7699d230Ba47796fc2E13fba1D2D52Ecb0318c33',
      },
      {
        lpTokenName: "ARTH.usd+val3eps",
        lpTokenAdrs: "0x41efe9ad56d328449439c330b327ca496c3e38bb"
      },
      // {
      //   lpTokenName: "ARTH.usd+val3EPS-Dot",
      //   lpTokenAdrs: "0x8189f0afdbf8fe6a9e13c69ba35528ac6abeb1af", // abi is different - DotDotStaking
      // },
      {
        lpTokenName: "ARTH.usd+3eps",
        lpTokenAdrs: '0x6398C73761a802a7Db8f6418Ef0a299301bC1Fb0', // abi is different - EllipsisStaking
      },
      // {
      //   lpTokenName: 'ARTH.usd+3epx',
      //   lpTokenAdrs: '0x5b74c99aa2356b4eaa7b85dc486843edff8dfdbe', // abi is different - EllipsisStaking
      // },
    ],
    chainWss: nconf.get('MAINNET_BSC1'),
    chainName: "BSC Mainnet",
  },
];

const farming = async (mode: any) => {

  console.log('config', config)

  let abi:any

  basicStaking.map((farm) => {
    const web3 = new Web3(farm.chainWss)

    farm.contrat.map((cont) => {
      if(cont.lpTokenName == 'ARTH.usd+3epx')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        abi = EllipsisStaking
      else if(cont.lpTokenName ==  "ARTH.usd+3eps")
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        abi = Arthu3eps
      else if(cont.lpTokenName ==  "ARTH.usd+val3EPS-Dot")
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        abi = DotDotStaking
      else
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        abi = farmingAbi


      const contract = new web3.eth.Contract(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        abi,
        cont.lpTokenAdrs
      )

      let lastCheck = Date.now()
      setInterval(() => {
        if (lastCheck < Date.now() - (60 * 1000 * 10)) {
          process.exit();
        }
      }, 3000)

      contract.events
        .allEvents()
        .on("connected", (nr: any) =>
          console.log(`connected ${farm.chainName} ${cont.lpTokenName}`)
        )
        .on("data", async (data: any) => {
          lastCheck = Date.now();

          console.log("data", data);
          let telegramMsg = "";
          let discordMsg = "";

          if (data.event == "Staked" || data.event == 'Deposit') {
            telegramMsg = await msgToBeSent(
              data,
              farm.chainName,
              cont.lpTokenName,
              'farming'
            );
            discordMsg = await msgToBeSent(
              data,
              farm.chainName,
              cont.lpTokenName,
              'farming'
            );
          }

          if (data.event == "Withdrawn" || data.event == 'Withdraw') {
            telegramMsg = await msgToBeSent(
              data,
              farm.chainName,
              cont.lpTokenName,
            );
            discordMsg = await msgToBeSent(
              data,
              farm.chainName,
              cont.lpTokenName,
            );
          }

          if (data.event == "RewardPaid" || data.event == 'ClaimedReward' || data.event == 'Claimed') {
            telegramMsg = await msgToBeSent(
              data,
              farm.chainName,
              cont.lpTokenName,
            );
            discordMsg = await msgToBeSent(
              data,
              farm.chainName,
              cont.lpTokenName,
            );
          }

          telegram.sendMessage(
            mode === 'production' ? config().production.TELEGRAM_CHAT_ID : config().staging.TELEGRAM_CHAT_ID,
            telegramMsg
          )
          discord.sendMessage(
            mode === 'production' ? config().production.DISCORD.Farming : config().staging.DISCORD,
            discordMsg
          )
        })
        .on("changed", (changed:any) => console.log("changed", changed))
        .on("error", (err:any) => {
          console.log("error farming", err)

        });

    });
  });
};

export default farming
