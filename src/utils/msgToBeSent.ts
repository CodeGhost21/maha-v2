import Numeral = require("numeral");
import moment from 'moment'
import {getCollateralPrices} from './getCollateralPrices'

import {getMahaPrice, getArthToUSD, tvlAprFn, poolTokenVal} from "./api";
import format = require("./formatValues");

export const msgToBeSent = async(data: any, chain?: string, poolName?: string, eventFrom?: string) => {
const allCollateralPrices:any = await getCollateralPrices()

  // console.log('allCollateralPrices', allCollateralPrices)

  let chainLink = "";
  let tvl = "";
  let apr = "";
  let msg = "";
  let poolLPVal = 1;
  let swapName = '';
  // let mahaToken = ''
  const tvlApr = await tvlAprFn();
  const lpPoolValObj = await poolTokenVal();

  // console.log('lpPoolValObj', lpPoolValObj)
  // console.log('chain', chain)

  if (chain == "Polygon Mainnet") {
    chainLink = "https://polygonscan.com";
    // mahaToken = "0xedd6ca8a4202d4a36611e2fff109648c4863ae19";
    console.log('If Polygon Mainnet')
    if (poolName == "ARTH.usd+3pool"){
      poolLPVal = lpPoolValObj.arthUsdc3Polygon
      tvl = tvlApr.polygon.tvl.arthu3pool.toLocaleString()
      apr = tvlApr.polygon.apr.arthu3pool
      swapName = "Polygon.Curve"
    }
    if (poolName === "ARTH/USDC LP"){
      poolLPVal = lpPoolValObj.arthUsdcPolygon
      tvl = tvlApr.polygon.tvl.arthUsdc.toLocaleString()
      apr = ''
      swapName = "QuickSwap";
    }
    if (poolName === "ARTH/MAHA LP"){
      poolLPVal = lpPoolValObj.arthMahaPolygon
      tvl = tvlApr.polygon.tvl.arthMaha.toLocaleString()
      apr = tvlApr.polygon.apr.arthMaha
      swapName = "QuickSwap";
    }
    if(poolName === "WETH"){
      poolLPVal = allCollateralPrices.WETH.toLocaleString()
      tvl = ''
      apr = ''

    }
    if(poolName === "DAI"){
      poolLPVal = allCollateralPrices.DAI.toLocaleString()
      tvl = ''
      apr = ''
    }
    if(poolName === "WMATIC"){
      poolLPVal = allCollateralPrices.WMATIC.toLocaleString()
      tvl = ''
      apr = ''
    }
    if(poolName === "USDCUSDT-QLP-S"){
      poolLPVal = 1
      tvl = ''
      apr = ''
    }

  }
  if (chain == "BSC Mainnet") {
    chainLink = "https://bscscan.com";
    // mahaToken = "0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b";
    apr = tvlApr.bsc.apr;

    if (poolName == "ARTH.usd+3eps"){
      poolLPVal = lpPoolValObj.arthUsdc3Bsc
      tvl = ''
      apr = tvlApr.bsc.apr['arthu3eps-v2']
      swapName = "Ellipsis"
    }
    if (poolName === "ARTH/BUSD LP"){
      poolLPVal = lpPoolValObj.arthBusdBsc
      tvl = tvlApr.bsc.tvl.arthBusd.toLocaleString()
      apr = ''
      swapName = "Pancakeswap"
    }
    if (poolName === "ARTH/MAHA LP"){
      poolLPVal = lpPoolValObj.arthMahaBsc
      tvl = tvlApr.bsc.tvl.arthMaha.toLocaleString()
      apr = ''
      swapName = "Pancakeswap"
    }
    if (poolName === "ARTH.usd+val3eps"){
      poolLPVal = 1
      tvl = tvlApr.bsc.tvl["arthu3valeps-v2"].toLocaleString()
      apr = tvlApr.bsc.apr["arthu3valeps-v2"]
      swapName = "Ellipsis"

    }
    if (poolName === "ARTH/MAHA Ape LP"){
      poolLPVal = 1
      tvl = tvlApr.bsc.tvl.arthMahaApe.toLocaleString()
      apr = tvlApr.bsc.apr.arthMahaApe
      swapName = "Apeswap"
    }
    if(poolName === 'ARTH.usd+3epx'){
      poolLPVal = 1
      tvl = tvlApr.bsc.apr['arthu3epx'].toLocaleString()
      apr = ''
      swapName = "Ellipsis"
    }
    if(poolName === 'ARTH.usd+val3EPS-Dot'){
      poolLPVal = 1
      tvl = tvlApr.bsc.apr['arthu3valdoteps'].toLocaleString()
      apr = ''
      swapName = "Ellipsis"
    }
    if (poolName === "MAHA"){
      poolLPVal = allCollateralPrices.MAHA.toLocaleString()
      tvl = ''
      apr = ''
    }
    if (poolName === "WBNB"){
      poolLPVal = allCollateralPrices.WBNB.toLocaleString()
      tvl = ''
      apr = ''
    }
    if (poolName === "BUSD"){
      poolLPVal = allCollateralPrices.BUSD.toLocaleString()
      tvl = ''
      apr = ''
    }
    if (poolName === "BUSDUSDC-APE-LP-S"){
      poolLPVal = 1
      tvl = ''
      apr = ''
    }
    if (poolName === "BUSDUSDT-APE-LP-S"){
      poolLPVal = 1
      tvl = ''
      apr = ''
    }
  }
  if(chain == "Ethereum"){
    chainLink = 'https://etherscan.io'

    if(poolName === "MAHA/ETH SushiSwap"){
      poolLPVal = 1
      tvl = ''
      apr = ''
      swapName = ""
    }
    if(poolName === "FRAX/ARTH.usd Curve"){
      poolLPVal = 1
      tvl = ''
      apr = ''
      swapName = ""
    }
    if(poolName === 'WETH'){
      poolLPVal = allCollateralPrices.WETH.toLocaleString()
      tvl = ''
      apr = ''
    }
    if(poolName === 'FXS'){
      poolLPVal = allCollateralPrices.FRAX.toLocaleString()
      tvl = ''
      apr = ''
    }
  }
  if(chain == 'Fantom Mainnet'){
    chainLink = "https://ftmscan.com"
    poolLPVal = 1
    tvl = ''
    apr = ''
  }


  let eventVal = '';
  let eventUser = data.returnValues.user;
  let url = `${chainLink}/address/${eventUser}`;
  let noOfTotalDots = 0
  let poolValues = ''

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
    `
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
    `
  }

  // BorrowOperation
  if (data.returnValues.operation == "0") {
    eventVal = format.toDisplayNumber(data.returnValues._debt)
    noOfTotalDots = Math.ceil(parseFloat(eventVal) / 100);
    msg = `Loan of *${eventVal}* Arth is taken by [${
      data.returnValues._borrower
    }](https://polygonscan.com/address/${
      data.returnValues._borrower
    }) with collateral of ${format.toDisplayNumber(
      data.returnValues._coll
    )} ${poolName}.`;

    poolValues = `
*1 ${poolName}* = *$${allCollateralPrices[`${poolName}`]}*
*1 ARTH* = *$${await getArthToUSD()}*
    `
  }
  if (data.returnValues.operation == "1") {
    // not getting any values in this event
    msg = `A Loan has been closed by [${data.returnValues._borrower}](https://polygonscan.com/address/${data.returnValues._borrower})`;
    poolValues = `
*1 ${poolName}* = *$${allCollateralPrices[`${poolName}`]}*
*1 ARTH* = *$${await getArthToUSD()}*
  `
  }
  if (data.returnValues.operation == "2") {
    // not getting any values in this event
    msg = `A Loan has been modified by [${data.returnValues._borrower}](https://polygonscan.com/address/${data.returnValues._borrower})`;
    poolValues = `
*1 ${poolName}* = *$${allCollateralPrices[`${poolName}`]}*
*1 ARTH* = *$${await getArthToUSD()}*
  `
  }

  // Farming
  if ((data.event == "Staked" || data.event == 'Deposit') && chain != 'Fantom Mainnet' && eventFrom == 'farming') {

    if (poolName === "ARTH/USDC LP")
      eventVal = format.toDisplayNumber(data.returnValues.amount * 1000000);
    else eventVal = format.toDisplayNumber(data.returnValues.amount);
    msg = `*${eventVal} ${poolName} ($${Numeral(parseFloat(eventVal) * poolLPVal).format(
      "0.000"
    )})* tokens has been staked on **${swapName} ${poolName} Staking Program** by [${eventUser}](${url})`;
    noOfTotalDots = Math.ceil((parseFloat(eventVal) * poolLPVal) / 100);
  }
  if (data.event === "Withdrawn"  || data.event == 'Withdraw') {
    if (poolName === "ARTH/USDC LP")
      eventVal = format.toDisplayNumber(data.returnValues.amount * 1000000);
    else eventVal = format.toDisplayNumber(data.returnValues.amount);
    console.log('eventVal', eventVal)
    msg = `*${eventVal} ${poolName} ($${Numeral(parseFloat(eventVal) * poolLPVal).format(
      "0.000"
    )})* tokens has been withdrawn from **${swapName} ${poolName} Staking Program** by [${eventUser}](${url})`;
    noOfTotalDots = Math.ceil((parseFloat(eventVal) * poolLPVal) / 100);
  }
  if (data.event == "RewardPaid" || data.event == 'ClaimedReward' || data.event == 'Claimed') {
    eventVal = format.toDisplayNumber(data.returnValues.reward) || format.toDisplayNumber(data.returnValues.amount);
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
    eventVal = format.toDisplayNumber(data.returnValues.principalCollateral[0])
    noOfTotalDots = Math.ceil(parseFloat(eventVal) / 100);
    msg = `A position has been closed by [${data.returnValues.who}](${url})`;
  }

  // FantomNotify
  if(data.event == "Deposit" && chain == 'Fantom Mainnet'){
    eventUser = data.returnValues.provider
    eventVal = format.toDisplayNumber(data.returnValues.value)
    url = `${chainLink}/address/${eventUser}`
    noOfTotalDots = Math.ceil(Number(eventVal) / 100)
    if(data.returnValues.deposit_type == '1')
      msg = `*${eventVal} FTM* tokens has been locked by [${eventUser}](${url})`
    if(data.returnValues.deposit_type == '2')
      msg = `*${eventVal}* more *FTM* tokens has been locked by [${eventUser}](${url})`
    if(data.returnValues.deposit_type == '3')
      msg = `The locking period of FTM token is extended till *${moment(
        data.returnValues.locktime * 1000
      ).format("DD MMM YYYY")}* by [${eventUser}](${url})`

  }

  if(data.event == "Voted" && chain == 'Fantom Mainnet'){
    msg = `FTM token *${data.returnValues.tokenId}* has been voted for *${format.toDisplayNumber(data.returnValues.weight)}%*`
  }
  // if(data.event == "ClaimRewards" && chain == 'Fantom Mainnet'){
  //   msg = `${data.returnValues.amount}`
  // }

  // MahaXNFT
  if(data.event == "Deposit" && eventFrom == 'mahaxnft'){
    eventUser = data.returnValues.provider
    eventVal = format.toDisplayNumber(data.returnValues.value)
    url = `https://mumbai.polygonscan.com/address/${eventUser}`
    chainLink = 'https://mumbai.polygonscan.com'
    if(data.returnValues.deposit_type == '1'){
      noOfTotalDots = Math.ceil(Number(eventVal) / 100)
      msg = `*${eventVal}* MAHA tokens has been locked for NFT by [${eventUser}](${url})`
    }
    if(data.returnValues.deposit_type == '2'){
      noOfTotalDots = Math.ceil(Number(eventVal) / 100)
      msg = `*${eventVal}* more *MAHA* tokens has been locked for NFT by [${eventUser}](${url})`
    }
    if(data.returnValues.deposit_type == '3')
      msg = `The locking period of MAHA token is extended for NFT till *${moment(
        data.returnValues.locktime * 1000).format("DD MMM YYYY")}* by [${eventUser}](${url})`
  }

  if(data.event == "Transfer" && eventFrom == 'mahaxnft'){
    const  from = data.returnValues.from
    const to = data.returnValues.to
    eventVal = format.toDisplayNumber(data.returnValues.value)
    url = `https://mumbai.polygonscan.com/address/${from}`
    chainLink = 'https://mumbai.polygonscan.com'

    msg = `An NFT is transferred from ${from} to ${to}`
  }

  let dots = "";
  for (let i = 0; i < noOfTotalDots; i++) {
    if (data.event == "Redemption" || data.returnValues.operation == "0" || data.event == "Staked" || data.event == 'Deposit' ||
      data.event == "RewardPaid" || data.event == "PositionOpened")
      dots = "🟢 " + dots;
    else if (data.event === "Withdrawn" || data.event == "PositionClosed" || data.event == "TroveLiquidated") dots = "🔴 " + dots;
    else dots = "" + dots;
  }

  const msgToReturn = `
🚀  ${msg}

${dots.length === 0 ?
  '' :
`${dots}
`}${poolValues &&`
${poolValues}
`}${tvl && `
TVL in this pool: *$`+ tvl + `*`}${ apr === '' ? '' : `
New APR: *` + Numeral(apr).format("0.000") +`%*`}

[📶 Transaction Hash 📶 ](${chainLink}/tx/${data.transactionHash})
  `;

  return msgToReturn;

}
