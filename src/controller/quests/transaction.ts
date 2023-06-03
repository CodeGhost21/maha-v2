import nconf from "nconf";
import { ethers } from "ethers";
import { approveQuest } from "../reviewQuest";
import { Quest } from "../../database/models/quest";
import { zelayRequest } from "../../utils/zelayRequest";
const abiCoder = new ethers.AbiCoder();

const provider = new ethers.JsonRpcProvider(nconf.get("ARBI_RPC"));

export const checkTransaction = async (data: string, quest: any) => {
  const walletAddress = await getWalletAddress(quest.user.id);
  const transactionReceipt: any = await provider.getTransactionReceipt(data);
  const txData = transactionReceipt.logs.filter(
    (log: any) =>
      log.address === nconf.get("POOL_ADDRESS") &&
      (log.topics[0] === nconf.get("SUPPLY_TOPIC") ||
        log.topics[0] === nconf.get("BORROW_TOPIC"))
  );
  const dataAbi = ["address", "uint256"];
  const response = await abiCoder.decode(dataAbi, txData[0].data);
  //check wallet address
  let questStatus = "success";
  let comment = "";

  if (walletAddress === transactionReceipt.from) {
    const amount = Number(response[1]) / 10 ** 6;
    if (txData[0].topics[0] === nconf.get("BORROW_TOPIC") && amount < 1) {
      questStatus = "fail";
      comment = "Borrow amount is low";
    } else if (
      txData[0].topics[0] === nconf.get("SUPPLY_TOPIC") &&
      amount < 5
    ) {
      questStatus = "fail";
      comment = "Supply amount is low";
    }
  } else {
    questStatus = "fail";
    comment = "wallet address doesn't match";
  }
  if (questStatus === "success") {
    await Quest.create({
      questId: quest.id,
      questDetails: quest,
      questName: quest.name,
    });
    await approveQuest([quest.id], questStatus, comment);
  }
};

export const getWalletAddress = async (userId: string) => {
  const url = `https://api.zealy.io/communities/themahadao/users/${userId}`;
  const response = await zelayRequest("get", url);
  return response.data.addresses.arbitrum;
};

// export const testTransaction = async () => {
//   console.log("testTransaction");
//   const regex = /tx\/(0x[a-fA-F0-9]{64})/;
//   const url =
//     "https://arbiscan.io/tx/0x1852114068d5dad91f6f6fb80810bb84f52180159968522c431f08d79ee2ae57";
//   const match: any = url.match(regex);

//   const hash = match[1];
//   console.log(hash);

//   const transactionReceipt: any = await provider.getTransactionReceipt(hash);
//   // console.log(transactionReceipt.logs);

//   const txData = transactionReceipt.logs.filter(
//     (log: any) =>
//       log.address === nconf.get("POOL_ADDRESS") &&
//       (log.topics[0] === nconf.get("SUPPLY_TOPIC") ||
//         log.topics[0] === nconf.get("BORROW_TOPIC"))
//   );

//   const dataAbi = ["address", "uint256"];
//   const response = await abiCoder.decode(dataAbi, txData[0].data);
//   console.log(response);

//   const amount = Number(response[1]) / 10 ** 6;

//   let questStatus = "success";
//   let comment = "";
//   console.log(txData[0].topics[0], amount);

//   if (txData[0].topics[0] === nconf.get("BORROW_TOPIC") && amount < 1) {
//     questStatus = "fail";
//     comment = "Borrow amount is low";
//   } else if (txData[0].topics[0] === nconf.get("SUPPLY_TOPIC") && amount < 5) {
//     questStatus = "fail";
//     comment = "Supply amount is low";
//   }
//   console.log(questStatus, "  ", comment);
// };
