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

export const cakeProvider = new ethers.JsonRpcProvider(
  nconf.get("CAKE_RPC_URL")
);

export const lineaProvider = new ethers.JsonRpcProvider(
  nconf.get("LINEA_RPC_URL")
);

export const ethLrtProvider = new ethers.JsonRpcProvider(
  nconf.get("ETH_LRT_RPC_URL")
);
