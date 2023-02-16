import nconf from "nconf";
import { ethers } from "ethers";
import { WebSocketProvider } from "@ethersproject/providers";

import PoolABI from "../abi/Pool.json";
import * as discord from "../output/discord";
import { getDisplayBalance } from "../utils/formatValues";
// import { getCollateralPrices } from "../utils/getCollateralPrices";
import { IEvent } from "../utils/interfaces";
import { getAssetName } from "../utils/getAssetName";
import { handleEmbedMessage } from "../helper/handleMessage";

const craftMessageFromEvent = async (data: IEvent, explorer: string) => {
  let msg = "";
  let noOfTotalDots = 0;

  const asset = getAssetName(data.args[0]);

  const who = data.args[1];
  const value = Number(
    getDisplayBalance(data.args[3], asset === "USDC" ? 6 : 18)
  );

  if (data.event == "Borrow") {
    const interestRateMode = data.args[4] === 1 ? "Stable" : "Variable";
    // const borrowRate = Number(data.args[5]._hex)
    noOfTotalDots = Math.ceil(value / 10);
    msg = `${value} ${asset} borrowed by ${who} with ${interestRateMode} interest rate.`;
  }

  if (data.event == "Supply") {
    noOfTotalDots = Math.ceil(value / 10);
    msg = `${value} ${asset} supplied by ${who}.`;
  }

  if (data.event == "Withdraw") {
    noOfTotalDots = Math.ceil(value / 10);
    msg = `${value} ${asset} withdrawn by ${who}.`;
  }

  if (data.event == "Repay") {
    noOfTotalDots = Math.ceil(value / 10);
    msg = `${value} ${asset} repaid by ${who}.`;
  }

  return craftMessage(
    msg,
    data.transactionHash,
    noOfTotalDots,
    explorer,
    data.event === "Withdraw" || data.event == "Repay" ? "red" : "green"
  );
};

const craftMessage = (
  msg: string,
  txHash: string,
  noOfTotalDots: number,
  explorer: string,
  dotType?: "green" | "red"
) => {
  let dots = "";

  if (dotType) {
    for (let i = 0; i < noOfTotalDots; i++) {
      if (dotType == "green") dots += "🚀";
      else dots += "🔴";
    }

    dots += "";
  }

  const hash = `<${explorer}/tx/${txHash}>`;

  console.log(`${msg}\n\n` + `${dots}\n\n` + `Transaction: ${hash}\n`);

  return `${msg}\n\n` + `${dots}\n\n` + `Transaction: ${hash}\n`;
};

export default () => {
  console.log("listening for mahalend events");

  const chainWss = nconf.get("RPC_WSS");
  const explorer = "https://etherscan.io";
  const pool = nconf.get("CONTRACT_POOL");

  const provider = new WebSocketProvider(chainWss);
  const contract = new ethers.Contract(pool, PoolABI, provider);

  contract.on("Supply", async (...args) => {
    const msg = await craftMessageFromEvent(args[5], explorer);
    const embedMessage = await handleEmbedMessage(msg || "");
    discord.sendMessage(nconf.get("CHANNEL_LENDING"), embedMessage);
  });

  contract.on("Withdraw", async (...args) => {
    const msg = await craftMessageFromEvent(args[4], explorer);
    const embedMessage = await handleEmbedMessage(msg || "");
    discord.sendMessage(nconf.get("CHANNEL_LENDING"), embedMessage);
  });

  contract.on("Borrow", async (...args) => {
    const msg = await craftMessageFromEvent(args[7], explorer);
    const embedMessage = await handleEmbedMessage(msg || "");
    discord.sendMessage(nconf.get("CHANNEL_LENDING"), embedMessage);
  });

  contract.on("Repay", async (...args) => {
    const msg = await craftMessageFromEvent(args[5], explorer);
    const embedMessage = await handleEmbedMessage(msg || "");
    discord.sendMessage(nconf.get("CHANNEL_LENDING"), embedMessage);
  });
};
