import nconf from "nconf";

import borrowerOperationsABI from "../abi/BorrowerOperations.json";
import troveManagerABI from "../abi/TroveManager.json";

import * as discord from "../output/discord";
import { IEvent } from "../utils/interfaces";
import { WebSocketProvider } from "@ethersproject/providers";

import { toDisplayNumber } from "../utils/formatValues";
import { ethers } from "ethers";
import { getCollateralPrices } from "../utils/getCollateralPrices";
import { handleEmbedMessage } from "../helper/handleMessage";

const craftMessage = (
  msg: string,
  txHash: string,
  account: string | undefined,
  noOfTotalDots: number,
  dotType?: "green" | "red"
) => {
  let dots = "";

  if (dotType && noOfTotalDots > 0) {
    for (let i = 0; i < noOfTotalDots; i++) {
      if (dotType == "green") dots += "💰";
      else dots += "🔴";
    }

    dots += "\n\n";
  }

  const explorer = "https://etherscan.io";
  const hash = `<${explorer}/tx/${txHash}>`;
  const loanLink = `<https://arth.loans/#/loan/details/${account}/ETH/>`;

  return (
    `${msg}\n\n` +
    `${dots}` +
    `Transaction: ${hash}` +
    (account ? `\nLoan Details: ${loanLink}` : "")
  );
};

const craftMessageFromEvent = async (data: IEvent) => {
  const prices = await getCollateralPrices();

  if (data.event == "TroveUpdated") {
    // event TroveUpdated(address indexed _borrower, uint _debt, uint _coll, uint stake, uint8 operation);
    const _borrower = data.args[0];
    const _debt = data.args[1];
    const _coll = data.args[2];
    const stake = data.args[3];
    const operation = Number(data.args[4]);

    const coll = Number(toDisplayNumber(_coll));
    const debt = Number(toDisplayNumber(_debt));

    const price = prices.ETH ? `*($${(coll * prices.ETH).toFixed(2)})*` : "";

    console.log("TroveUpdated", _borrower, _debt, _coll, stake, operation);

    if (operation == 0) {
      const noOfTotalDots = Math.ceil(_coll / 0.1);
      const msg = `Loan of \`*${debt}* ARTH\` is created by ${_borrower} with \`${coll} ETH\` ${price}.`;

      return craftMessage(
        msg,
        data.transactionHash,
        _borrower,
        noOfTotalDots,
        "green"
      );
    }

    if (operation == 1) {
      // not getting any values in this event
      const msg = `**${_borrower}**'s loan has now been closed.`;

      return craftMessage(msg, data.transactionHash, _borrower, 1, "red");
    }

    if (operation == 2) {
      // not getting any values in this event
      const msg =
        `**${_borrower}**'s loan was modified. It now has a debt of \`${debt} ARTH\`` +
        ` against a collateral of \`${coll} ETH\` ${price}.`;

      const noOfTotalDots = Math.ceil(_coll / 0.1);

      return craftMessage(
        msg,
        data.transactionHash,
        _borrower,
        noOfTotalDots,
        "green"
      );
    }
  } else if (data.event == "TroveLiquidated") {
    // event TroveLiquidated(address indexed _borrower, uint _debt, uint _coll, uint8 operation);
    const _borrower = data.args[0];
    const _debt = data.args[1];
    const _coll = data.args[2];
    const operation = data.args[3];

    const coll = Number(toDisplayNumber(_coll));
    const debt = Number(toDisplayNumber(_debt));

    console.log("TroveUpdated", _borrower, debt, coll, operation);

    const price = prices.ETH ? `*($${(coll * prices.ETH).toFixed(2)})*` : "";

    const msg =
      `\`${coll} ETH\` ${price} has been liquidated with` +
      ` the debt of \`${debt} ARTH\`.`;

    const noOfTotalDots = Math.ceil(coll / 0.1);

    return craftMessage(
      msg,
      data.transactionHash,
      _borrower,
      noOfTotalDots,
      "red"
    );
  } else if (data.event == "Redemption") {
    // event Redemption(uint _attemptedLUSDAmount, uint _actualLUSDAmount, uint _ETHSent, uint _ETHFee);
    const _attemptedLUSDAmount = data.args[0];
    const _actualLUSDAmount = data.args[1];
    const _ETHSent = data.args[2];
    const _ETHFee = data.args[3];

    console.log(
      "Redemption",
      _attemptedLUSDAmount,
      _actualLUSDAmount,
      _ETHSent,
      _ETHFee
    );

    const arthVal = toDisplayNumber(_actualLUSDAmount);
    const ethVal = Number(toDisplayNumber(_ETHSent));

    const price = prices.ETH ? `*($${(ethVal * prices.ETH).toFixed(2)})*` : "";
    const noOfTotalDots = Math.ceil(ethVal / 0.1);

    const msg = `\`${arthVal} ARTH\` has been redeemed for \`${ethVal} ETH\` ${price}`;

    return craftMessage(
      msg,
      data.transactionHash,
      undefined,
      noOfTotalDots,
      "red"
    );
  }

  return;
};

export default () => {
  console.log("listening for arth events");

  const chainWss = nconf.get("RPC_WSS");

  const borrowingOperationsAddr = nconf.get("CONTRACT_ARTH_BO");
  const troveManagerAddr = nconf.get("CONTRACT_ARTH_TM");

  const provider = new WebSocketProvider(chainWss);

  const borrowerOperations = new ethers.Contract(
    borrowingOperationsAddr,
    borrowerOperationsABI,
    provider
  );
  const troveManager = new ethers.Contract(
    troveManagerAddr,
    troveManagerABI,
    provider
  );

  borrowerOperations.on("TroveUpdated", async (...args) => {
    // event TroveUpdated(address indexed _borrower, uint _debt, uint _coll, uint stake, uint8 operation);
    const msg = await craftMessageFromEvent(args[5]);
    const embedMessage = await handleEmbedMessage(msg || "");
    console.log(msg);
    discord.sendMessage(nconf.get("CHANNEL_ARTH_ACTIVITY"), embedMessage);
  });

  troveManager.on("TroveLiquidated", async (...args) => {
    // event TroveLiquidated(address indexed _borrower, uint _debt, uint _coll, uint8 operation);
    const msg = await craftMessageFromEvent(args[4]);
    const embedMessage = await handleEmbedMessage(msg || "");
    discord.sendMessage(nconf.get("CHANNEL_ARTH_ACTIVITY"), embedMessage);
  });

  troveManager.on("Redemption", async (...args) => {
    // event Redemption(uint _attemptedLUSDAmount, uint _actualLUSDAmount, uint _ETHSent, uint _ETHFee);
    const msg = await craftMessageFromEvent(args[4]);
    const embedMessage = await handleEmbedMessage(msg || "");
    discord.sendMessage(nconf.get("CHANNEL_ARTH_ACTIVITY"), embedMessage);
  });
};
