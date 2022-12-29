import Numeral = require("numeral");
import moment from "moment";
import { getCollateralPrices } from "./getCollateralPrices";

import { getMahaPrice, getArthToUSD } from "./api";
import format = require("./formatValues");

export const msgToBeSent = async (
  data: any,
  chain?: string,
  poolName?: string,
  eventFrom?: string
) => {
  const allCollateralPrices: any = await getCollateralPrices();

  // console.log('allCollateralPrices', allCollateralPrices)

  let chainLink = "";
  let msg = "";
  const poolLPVal = 1;
  const swapName = "";

  if (chain == "Polygon Mainnet") {
    chainLink = "https://polygonscan.com";
  }
  if (chain == "BSC Mainnet") {
    chainLink = "https://bscscan.com";
  }
  ``;
  if (chain == "Ethereum") {
    chainLink = "https://etherscan.io";
  }
  if (chain == "Fantom Mainnet") {
    chainLink = "https://ftmscan.com";
  }

  if (chain == "BSC Testnet") {
    chainLink = "https://testnet.bscscan.com";
  }

  if (chain == "Rinkeby") {
    chainLink = "https://rinkeby.etherscan.io";
  }

  let eventVal = "";
  let eventUser = data.returnValues.user;
  let url = `${chainLink}/address/${eventUser}`;
  let noOfTotalDots = 0;
  let poolValues = "";

  //TroveManager
  if (data.event == "TroveLiquidated") {
    eventVal = format.toDisplayNumber(data.returnValues._coll);
    msg = `${eventVal} MAHA has been liquidated with the debt of ${format.toDisplayNumber(
      data.returnValues._debt
    )} Arth.`;
    noOfTotalDots = Math.ceil(parseFloat(eventVal) / 100);
    poolValues = `
*1 MAHA* = *$${await getMahaPrice()}*
*1 ARTH* = *$${await getArthToUSD()}*
    `;
  }
  if (data.event == "Redemption") {
    eventVal = format.toDisplayNumber(data.returnValues._actualLUSDAmount);
    msg = `${eventVal} ARTH has been redeemed for ${format.toDisplayNumber(
      data.returnValues._ETHSent
    )} MAHA`;
    noOfTotalDots = Math.ceil(parseFloat(eventVal) / 100);
    poolValues = `
*1 MAHA* = *$${await getMahaPrice()}*
*1 ARTH* = *$${await getArthToUSD()}*
    `;
  }

  // BorrowOperation
  if (data.returnValues.operation == "0") {
    eventVal = format.toDisplayNumber(data.returnValues._debt);
    noOfTotalDots = Math.ceil(parseFloat(eventVal) / 100);
    msg = `Loan of *${eventVal}* Arth is taken by [${
      data.returnValues._borrower
    }](${chainLink}/address/${
      data.returnValues._borrower
    }) with collateral of ${format.toDisplayNumber(
      data.returnValues._coll
    )} ${poolName}.`;

    poolValues = `
*1 ${poolName}* = *$${allCollateralPrices[`${poolName}`]}*
*1 ARTH* = *$${await getArthToUSD()}*
    `;
  }
  if (data.returnValues.operation == "1") {
    // not getting any values in this event
    msg = `A Loan has been closed by [${data.returnValues._borrower}](${chainLink}/address/${data.returnValues._borrower})`;
    poolValues = `
*1 ${poolName}* = *$${allCollateralPrices[`${poolName}`]}*
*1 ARTH* = *$${await getArthToUSD()}*
  `;
  }
  if (data.returnValues.operation == "2") {
    // not getting any values in this event
    msg = `A Loan has been modified by [${data.returnValues._borrower}](${chainLink}/address/${data.returnValues._borrower})`;
    poolValues = `
*1 ${poolName}* = *$${allCollateralPrices[`${poolName}`]}*
*1 ARTH* = *$${await getArthToUSD()}*
  `;
  }

  // Farming
  if (
    (data.event == "Staked" || data.event == "Deposit") &&
    chain != "Fantom Mainnet" &&
    eventFrom == "farming"
  ) {
    if (poolName === "ARTH/USDC LP")
      eventVal = format.toDisplayNumber(data.returnValues.amount * 1000000);
    else eventVal = format.toDisplayNumber(data.returnValues.amount);
    msg = `*${eventVal} ${poolName} ($${Numeral(
      parseFloat(eventVal) * poolLPVal
    ).format(
      "0.000"
    )})* tokens has been staked on **${swapName} ${poolName} Staking Program** by [${eventUser}](${url})`;
    noOfTotalDots = Math.ceil((parseFloat(eventVal) * poolLPVal) / 100);
  }
  if (data.event === "Withdrawn" || data.event == "Withdraw") {
    if (poolName === "ARTH/USDC LP")
      eventVal = format.toDisplayNumber(data.returnValues.amount * 1000000);
    else eventVal = format.toDisplayNumber(data.returnValues.amount);
    console.log("eventVal", eventVal);
    msg = `*${eventVal} ${poolName} ($${Numeral(
      parseFloat(eventVal) * poolLPVal
    ).format(
      "0.000"
    )})* tokens has been withdrawn from **${swapName} ${poolName} Staking Program** by [${eventUser}](${url})`;
    noOfTotalDots = Math.ceil((parseFloat(eventVal) * poolLPVal) / 100);
  }
  if (
    data.event == "RewardPaid" ||
    data.event == "ClaimedReward" ||
    data.event == "Claimed"
  ) {
    eventVal =
      format.toDisplayNumber(data.returnValues.reward) ||
      format.toDisplayNumber(data.returnValues.amount);
    console.log("RewardPaid", eventVal, data.returnValues.reward);
    msg = `*${eventVal} MAHA* tokens has been claimed as reward from **${swapName} ${poolName} Staking Program** by [${eventUser}](${url})`;
    noOfTotalDots = Math.ceil((parseFloat(eventVal) * poolLPVal) / 100);
  }

  // Leverage
  if (data.event == "PositionOpened") {
    eventVal = format.toDisplayNumber(data.returnValues.principalCollateral[0]);
    noOfTotalDots = Math.ceil(parseFloat(eventVal) / 100);
    msg = `A position has been opened with the collateral of ${eventVal} ${poolName} token by [${data.returnValues.who}](${url})`;
  }
  if (data.event == "PositionClosed") {
    eventVal = format.toDisplayNumber(data.returnValues.principalCollateral[0]);
    noOfTotalDots = Math.ceil(parseFloat(eventVal) / 100);
    msg = `A position has been closed by [${data.returnValues.who}](${url})`;
  }

  // FantomNotify
  if (data.event == "Deposit" && chain == "Fantom Mainnet") {
    eventUser = data.returnValues.provider;
    eventVal = format.toDisplayNumber(data.returnValues.value);
    url = `${chainLink}/address/${eventUser}`;
    noOfTotalDots = Math.ceil(Number(eventVal) / 100);
    if (data.returnValues.deposit_type == "1")
      msg = `*${eventVal} FTM* tokens has been locked by [${eventUser}](${url})`;
    if (data.returnValues.deposit_type == "2")
      msg = `*${eventVal}* more *FTM* tokens has been locked by [${eventUser}](${url})`;
    if (data.returnValues.deposit_type == "3")
      msg = `The locking period of FTM token is extended till *${moment(
        data.returnValues.locktime * 1000
      ).format("DD MMM YYYY")}* by [${eventUser}](${url})`;
  }

  if (data.event == "Voted" && chain == "Fantom Mainnet") {
    msg = `FTM token *${
      data.returnValues.tokenId
    }* has been voted for *${format.toDisplayNumber(
      data.returnValues.weight
    )}%*`;
  }
  // if(data.event == "ClaimRewards" && chain == 'Fantom Mainnet'){
  //   msg = `${data.returnValues.amount}`
  // }

  // MahaXNFT
  if (data.event == "Deposit" && eventFrom == "mahaxnft") {
    eventUser = data.returnValues.provider;
    eventVal = format.toDisplayNumber(data.returnValues.value);
    url = `${chainLink}/address/${eventUser}`;

    if (data.returnValues.deposit_type == "1") {
      noOfTotalDots = Math.ceil(Number(eventVal) / 100);
      msg = `*${eventVal}* MAHA tokens has been locked for NFT by [${eventUser}](${url})`;
    }
    if (data.returnValues.deposit_type == "2") {
      noOfTotalDots = Math.ceil(Number(eventVal) / 100);
      msg = `*${eventVal}* more *MAHA* tokens has been locked for NFT by [${eventUser}](${url})`;
    }
    if (data.returnValues.deposit_type == "3")
      msg = `The lock period of MAHA token is extended for NFT till *${moment(
        data.returnValues.locktime * 1000
      ).format("DD MMM YYYY")}* by [${eventUser}](${url})`;
  }

  if (
    data.event == "Transfer" &&
    eventFrom == "mahaxnft" &&
    data.returnValues.from !== "0x0000000000000000000000000000000000000000"
  ) {
    const from = data.returnValues.from;
    const to = data.returnValues.to;
    console.log("chainLink", chainLink);
    const fromUrl = `${chainLink}/address/${from}`;
    const toUrl = `${chainLink}/address/${to}`;

    msg = `An NFT is transferred from [${from}](${fromUrl}) to [${to}](${toUrl})`;
  }

  if (data.event == "Withdraw" && eventFrom == "mahaxnft") {
    eventUser = data.returnValues.provider;
    url = `${chainLink}/address/${eventUser}`;

    msg = `An NFT is has been withdrawn by [${eventUser}](${url})`;
  }

  let dots = "";
  for (let i = 0; i < noOfTotalDots; i++) {
    if (
      data.event == "Redemption" ||
      data.returnValues.operation == "0" ||
      data.event == "Staked" ||
      data.event == "Deposit" ||
      data.event == "RewardPaid" ||
      data.event == "PositionOpened"
    )
      dots = "🟢 " + dots;
    else if (
      data.event === "Withdrawn" ||
      data.event == "PositionClosed" ||
      data.event == "TroveLiquidated"
    )
      dots = "🔴 " + dots;
    else dots = "" + dots;
  }

  const msgToReturn = `
🚀  ${msg}

${
  dots.length === 0
    ? ""
    : `${dots}
`
}${
    poolValues &&
    `
${poolValues}
`
  }

[📶 Transaction Hash 📶 ](${chainLink}/tx/${data.transactionHash})`;

  return msgToReturn;
};
