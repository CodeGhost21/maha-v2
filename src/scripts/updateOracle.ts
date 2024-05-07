import nconf from "nconf";
import * as ethers from "ethers";
import { lineaProvider } from "../utils/providers";
import { getPriceCoinGecko } from "../controller/quests/onChainPoints";

import oracleABI from "../abis/Oracle.json";

const oracleAddress = "0x1C2B983E1FE9830B80c315b7dd2A331960C842DC";
const PK = nconf.get("PRICE_UPDATE_PRIVATE_KEY");

export const updatePrice = async () => {
  const tokenPrice = await getPriceCoinGecko();
  console.log(tokenPrice);

  const latestZerolendPrice = tokenPrice.zerolend;
  console.log(latestZerolendPrice);

  // Connect to your Ethereum account
  const wallet = new ethers.Wallet(PK, lineaProvider);

  // Signer instance to send transactions
  const signer = wallet.connect(lineaProvider);
  const contract = new ethers.Contract(oracleAddress, oracleABI, signer);

  try {
    // const tx = await contract.setAnswer(Math.floor(latestZerolendPrice * 1e8));
    // await tx.wait();
    // console.log(`Price updating tx:${tx.hash}`);
  } catch (e) {
    console.log(e);
  }
};

updatePrice();
