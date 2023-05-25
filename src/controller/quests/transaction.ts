import nconf from "nconf";
import { ethers } from "ethers";
import { approveQuest } from "../reviewQuest";
import { Quest } from "../../database/models/quest";
const abiCoder = new ethers.AbiCoder();

const provider = new ethers.JsonRpcProvider(nconf.get("ARBI_RPC"));

export const checkTransaction = async (data: string, quest: any) => {
  const transactionReceipt: any = await provider.getTransactionReceipt(data);

  const supplyBorrowTx = transactionReceipt.logs.filter(
    (log: any) =>
      log.address === nconf.get("POOL_ADDRESS") &&
      (log.topics[0] === nconf.get("SUPPLY_TOPIC") ||
        log.topics[0] === nconf.get("BORROW_TOPIC"))
  );

  const dataAbi = ["address", "uint256"];
  const response = await abiCoder.decode(dataAbi, supplyBorrowTx[0].data);
  const amount = Number(response[1]) / 10 ** 6;

  let questStatus = "success";
  let comment = "";
  if (supplyBorrowTx[0].topics[0] === nconf.get("BORROW_TOPIC") && amount < 1) {
    questStatus = "fail";
    comment = "Borrow amount is low";
  } else if (
    supplyBorrowTx[0].topics[0] === nconf.get("SUPPLY_TOPIC") &&
    amount < 5
  ) {
    questStatus = "fail";
    comment = "Supply amount is low";
  }
  if (questStatus === "success") {
    await Quest.create({
      questId: quest.id,
      questDetails: quest,
      questName: quest.name,
    });
  }
  if (questStatus === "success") {
    await approveQuest([quest.id], questStatus, comment);
  }
};

// export const testTransaction = async () => {
//   console.log("testTransaction");

//   const hash =
//     "0x5fbc44c1ba562d4ca1fce015872d57a30b9662b07a9b998ba039cd533d84098c";

//   const transactionReceipt: any = await provider.getTransactionReceipt(hash);
//   // console.log(transactionReceipt.logs);

//   const supplyBorrowTx = transactionReceipt.logs.filter(
//     (log: any) =>
//       log.address === nconf.get("POOL_ADDRESS") &&
//       (log.topics[0] === nconf.get("SUPPLY_TOPIC") ||
//         log.topics[0] === nconf.get("BORROW_TOPIC"))
//   );

//   const dataAbi = ["address", "uint256"];
//   const response = await abiCoder.decode(dataAbi, supplyBorrowTx[0].data);

//   const amount = Number(response[1]) / 10 ** 6;

//   let questStatus = "success";
//   let comment = "";

//   if (supplyBorrowTx[0].topics[0] === nconf.get("BORROW_TOPIC") && amount < 1) {
//     questStatus = "fail";
//     comment = "Borrow amount is low";
//   } else if (
//     supplyBorrowTx[0].topics[0] === nconf.get("SUPPLY_TOPIC") &&
//     amount < 5
//   ) {
//     questStatus = "fail";
//     comment = "Supply amount is low";
//   }
//   console.log(questStatus, "  ", comment);
// };
