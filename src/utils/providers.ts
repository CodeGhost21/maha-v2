import nconf from "nconf";
import { ethers } from "ethers";

export const ethProvider = new ethers.JsonRpcProvider(
  nconf.get("ETH_LRT_RPC_URL")
);
