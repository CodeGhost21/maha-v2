import nconf from "nconf";
import { ethers } from "ethers";
const abiCoder = new ethers.AbiCoder();

const provider = new ethers.JsonRpcProvider(nconf.get("ARBI_RPC"));

export const checkTransaction = async (data: string) => {
  const transactionReceipt: any = await provider.getTransactionReceipt(data);

  const supply = transactionReceipt.logs.filter(
    (log: any) =>
      log.address === nconf.get("POOL_ADDRESS") &&
      log.topics[0] === nconf.get("SUPPLY_TOPIC")
  );

  const dataAbi = ["address", "uint256"];
  const response = await abiCoder.decode(dataAbi, supply[0].data);
  const amount = Number(response[1]) / 10 ** 6;
  return amount > 5;
};
