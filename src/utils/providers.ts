import nconf from "nconf";
import { ethers } from "ethers";

export const zksyncProvider = new ethers.JsonRpcProvider(
  nconf.get("ZKSYNC_RPC_URL")
);

export const mantaProvider = new ethers.JsonRpcProvider(
  nconf.get("MANTA_RPC_URL")
);

export const blastProvider = new ethers.JsonRpcProvider(
  nconf.get("BLAST_RPC_URL")
);
