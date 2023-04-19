import nconf from "nconf";
import { ethers } from "ethers";
import { approveQuest } from "../reviewQuest";
const abiCoder = new ethers.AbiCoder();

const provider = new ethers.JsonRpcProvider(nconf.get("ARBI_RPC"));

export const checkTransaction = async (data: string, questId: string) => {
  const transactionReceipt: any = await provider.getTransactionReceipt(data);

  const supply = transactionReceipt.logs.filter(
    (log: any) =>
      log.address === nconf.get("POOL_ADDRESS") &&
      log.topics[0] === nconf.get("SUPPLY_TOPIC")
  );

  const dataAbi = ["address", "uint256"];
  const response = await abiCoder.decode(dataAbi, supply[0].data);
  const amount = Number(response[1]) / 10 ** 6;
  let questStatus = "success";
  let comment = "";
  if (amount < 5) {
    questStatus = "fail";
    comment = "Supply amount is low";
  }
  await approveQuest([questId], questStatus, comment);
  // return amount > 5;
};
