import nconf from "nconf";
import Web3 from "web3";

import borrowerOperationsAbi from "../../abi/BorrowerOperations.json";
// import {borrowOpTelegramMsg, borrowOpDiscordMsg} from '../../utils/msgToBeSent'
import { msgToBeSent } from "../../utils/msgToBeSent";
import * as discord from "../../output/discord";
import { config } from "../../utils/config";

// For Create, Update, Close the loan

const borrowingContracts = [
  // {
  //   chainName: 'Ethereum',
  //   chainWss: nconf.get('MAINNET_ETH'),
  //   contract: [
  //     {
  //       collName: "ETH",
  //       collAdrs: "0xD3761E54826837B8bBd6eF0A278D5b647B807583"
  //     }
  //   ],

  // },
  {
    chainName: "BSC Testnet",
    chainWss: nconf.get("TESTNET_BSC"),
    contract: [
      {
        collName: "BNB",
        collAdrs: "0x7A90B087e746d98327d48D15163Fbbf1FFd4e4e6",
      },
    ],
  },
];

const borrowingOperations = (mode: string) => {
  borrowingContracts.map((borrowContract: any) => {
    const web3 = new Web3(borrowContract.chainWss);

    borrowContract.contract.map((adrs: any) => {
      new web3.eth.Contract(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        borrowerOperationsAbi,
        adrs.collAdrs
      ).events
        .allEvents()
        .on("connected", () =>
          console.log(
            `connected borrow ${borrowContract.chainName} ${adrs.collName}`
          )
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on("data", async (event: any) => {
          console.log("borrowContract", event);
          // let telegramMsg: string;
          let discordMsg: string;

          if (event.event == "TroveUpdated") {
            // telegramMsg = await msgToBeSent(
            //   event,
            //   borrowContract.chainName,
            //   adrs.collName
            // );
            discordMsg = await msgToBeSent(
              event,
              borrowContract.chainName,
              adrs.collName
            );

            discord.sendMessage(
              mode === "production"
                ? config().production.DISCORD.Borrow
                : config().staging.DISCORD,
              discordMsg
            );
          }
        })
        .on("error", (err: any) => {
          console.log("error borrowingOps", err);
        });
    });
  });
};

export default borrowingOperations;
