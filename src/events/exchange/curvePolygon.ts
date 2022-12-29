import nconf from "nconf";
import Web3 from "web3";
import { ethers } from "ethers";

import StableSwapABI from "../../abi/StableSwap.json";
import { toDisplayNumber } from "../../utils/formatValues";
import {getArthToUSD} from '../../utils/api'
import * as telegram from "../../output/telegram";
import * as discord from "../../output/discord";
import { config } from '../../utils/config';

const telegramTemplate = (
  tokenSoldAmt: string,
  tokenSold: string,
  tokenBoughtAmt: string,
  tokenBought: string,
  buyer: string,
  transactionHash: string,
  noOfTotalDots: number,
  dotColor: string
) => {
  let dots = "";
  for (let i = 0; i < noOfTotalDots; i++) {
    if (dotColor == "red") dots = "🔴 " + dots;
    else if (dotColor == "green") dots = "🟢 " + dots;
  }

  return `🚀  *${tokenSoldAmt} ${tokenSold}* has been sold for *${tokenBoughtAmt} ${tokenBought}* by [${buyer}](https://polygonscan.com/address/${buyer})

${dots}

*1 ARTH* = *$${getArthToUSD()}*

[📶 Transaction Hash 📶 ](https://polygonscan.com/tx/${transactionHash})
`;
};

const discordTemplate = (
  tokenSoldAmt: string,
  tokenSold: string,
  tokenBoughtAmt: string,
  tokenBought: string,
  buyer: string,
  transactionHash: string,
  noOfTotalDots: number,
  dotColor: string
) => {
  let dots = "";
  for (let i = 0; i < noOfTotalDots; i++) {
    if (dotColor == "red") dots = "🔴 " + dots;
    else if (dotColor == "green") dots = "🟢 " + dots;
  }

  return `🚀  *${tokenSoldAmt} ${tokenSold}* has been sold for *${tokenBoughtAmt} ${tokenBought}* by [${buyer}](https://polygonscan.com/address/${buyer})

${dots}

*1 ARTH* = *$${getArthToUSD()}*

[📶 Transaction Hash 📶 ](https://polygonscan.com/tx/${transactionHash})
`;
};

const main = (mode: any) => {
  const web3 = new Web3(nconf.get("MAINNET_BSC"));
  const contract = new web3.eth.Contract(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    StableSwapABI,
    '0x62d05F6d5DDEBFaa4E866086dcdacD76A272D321'
  );

  console.log('contract.events', contract.events)

  contract.events
    .allEvents()
    .on("connected", () => console.log("connected"))
    .on("data", async (data: any) => {
      let dotColor = "";
      console.log('data', data)
      if (data.event != "TokenExchangeUnderlying") return;

      let tokenSold = "";
      let tokenSoldAmt = "";
      let tokenBought = "";
      let tokenBoughtAmt = "";
      let noOfTotalDots = 0;

      if (data.returnValues.sold_id == "0") {
        tokenSold = "Arth.usd";
        tokenSoldAmt = toDisplayNumber(data.returnValues.tokens_sold);
        noOfTotalDots = Math.ceil(Number(tokenSoldAmt) / 100);
        dotColor = "red";
      } else if (data.returnValues.sold_id == "1") {
        tokenSold = "DAI";
        tokenSoldAmt = toDisplayNumber(data.returnValues.tokens_sold);
      } else if (data.returnValues.sold_id == "2") {
        tokenSold = "USDC";
        tokenSoldAmt = ethers.utils.formatUnits(
          data.returnValues.tokens_sold,
          6
        );
      } else {
        tokenSold = "USDT";
        tokenSoldAmt = ethers.utils.formatUnits(
          data.returnValues.tokens_sold,
          6
        );
      }

      if (data.returnValues.bought_id == "0") {
        tokenBought = "Arth.usd";
        tokenBoughtAmt = toDisplayNumber(data.returnValues.tokens_bought);
        noOfTotalDots = Math.ceil(Number(tokenBoughtAmt) / 100);
        dotColor = "green";
      } else if (data.returnValues.bought_id == "1") {
        tokenBought = "DAI";
        tokenBoughtAmt = toDisplayNumber(data.returnValues.tokens_bought);
      } else if (data.returnValues.bought_id == "2") {
        tokenBought = "USDC";
        tokenBoughtAmt = ethers.utils.formatUnits(
          data.returnValues.tokens_bought,
          6
        );
      } else {
        tokenBought = "USDT";
        tokenBoughtAmt = ethers.utils.formatUnits(
          data.returnValues.tokens_bought,
          6
        );
      }

      telegram.sendMessage(
        mode === 'production' ? config().production.TELEGRAM_CHAT_ID : config().staging.TELEGRAM_CHAT_ID,
        telegramTemplate(
          tokenSoldAmt,
          tokenSold,
          tokenBoughtAmt,
          tokenBought,
          data.returnValues.buyer,
          data.transactionHash,
          noOfTotalDots,
          dotColor
        )
      );

      discord.sendMessage(
        mode === 'production' ? config().production.DISCORD.curvePolygon : config().staging.DISCORD,
        discordTemplate(
          tokenSoldAmt,
          tokenSold,
          tokenBoughtAmt,
          tokenBought,
          data.returnValues.buyer,
          data.transactionHash,
          noOfTotalDots,
          dotColor
        )
      );
    });
};

export default main
