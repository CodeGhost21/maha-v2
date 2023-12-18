import nconf from "nconf";
import { ethers } from "ethers";

import troveManagerABI from "../abis/TroveManager.json";
import poolABI from "../abis/Pool.json";
import stabilityPool from "../abis/StabilityPool.json";

const provider = new ethers.JsonRpcProvider(nconf.get("ZKSYNC_RPC_URL"));
export const PoolContract = new ethers.Contract(
  nconf.get("POOL"),
  poolABI,
  provider
);

export const TroveContract = new ethers.Contract(
  nconf.get("TROVE"),
  troveManagerABI,
  provider
);

export const StabilityPool = new ethers.Contract(
  nconf.get("STABILITYPOOL"),
  stabilityPool,
  provider
);
