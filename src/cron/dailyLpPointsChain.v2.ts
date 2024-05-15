import { UserPointTransactions } from "../database/models/userPointTransactions";
import { supplyBorrowPointsGQL } from "../controller/quests/onChainPoints";
import { IWalletUserPoints } from "../database/interface/walletUser/walletUserPoints";
import { getEpoch } from "../utils/epoch";
import { AbstractProvider } from "ethers";
import {
  IAssignPointsTask,
  assignPointsPerSecondToBatch,
} from "../controller/quests/assignPoints";
import { IWalletUserModel, WalletUserV2 } from "../database/models/walletUsersV2";
import {
  mantaProvider,
  zksyncProvider,
  blastProvider,
  lineaProvider,
  ethLrtProvider,
  xLayerProvider,
} from "../utils/providers";
import {
  apiBlast,
  apiEth,
  apiLinea,
  apiManta,
  apiXLayer,
  apiZKSync,
} from "../controller/quests/constants";

const _processBatch = async (
  api: string,
  userBatch: IWalletUserModel[],
  epoch: number,
  supplyTask: keyof IWalletUserPoints,
  borrowTask: keyof IWalletUserPoints,
  p: AbstractProvider,
  supplyMultiplier: number
) => {

  try {
    const data = await supplyBorrowPointsGQL(api, userBatch, p, supplyMultiplier);

    const tasks: IAssignPointsTask[] = [];

    // update supply points
    const supplyExecutable = await assignPointsPerSecondToBatch(
      userBatch,
      data.supply,
      supplyTask,
      `Daily Supply on ${supplyTask.substring(6)} chain`,
      true,
      epoch
    );
    await supplyExecutable?.execute();

    // update borrow points
    const borrowExecutable = await assignPointsPerSecondToBatch(
      userBatch,
      data.borrow,
      borrowTask,
      `Daily Borrow on ${borrowTask.substring(6)} chain`,
      true,
      epoch
    );

    await borrowExecutable?.execute();

    console.log("done with batch", tasks.length);
  } catch (error) {
    console.log(
      `processBatch error for ${supplyTask.substring(6)} chain`,
      error
    );
  }
};

const _dailyLpPoints = async (
  api: string,
  count: number,
  supplyTask: keyof IWalletUserPoints,
  borrowTask: keyof IWalletUserPoints,
  p: AbstractProvider,
  supplyMultiplier: number
) => {
  const epoch = getEpoch();
  console.log("working with epoch", epoch);

  const query = {
    $or: [
      { [`epochs.${supplyTask}`]: 0 },
      { [`epochs.${supplyTask}`]: undefined },
    ],
  };

  const chunk = 1000;
  const loops = Math.floor(count / chunk) + 1;

  for (let i = 0; i < loops; i++) {
    try {
      const users = await WalletUserV2.find(query)
        .limit(chunk)
        .skip(i * chunk)
        .select(["walletAddress", "totalPoints", "referredBy"]);

      console.log("working on batch", i);
      await _processBatch(
        api,
        users,
        epoch,
        supplyTask,
        borrowTask,
        p,
        supplyMultiplier
      );
    } catch (error) {
      console.log("error", error);
      console.log("failure working with batch", i);
    }
  }

  console.log("done");
};

const lock: { [chain: string]: boolean } = {};
const _dailyLpPointsChain = async (
  api: string,
  supplyTask: keyof IWalletUserPoints,
  borrowTask: keyof IWalletUserPoints,
  p: AbstractProvider,
  supplyMultiplier: number
) => {
  console.log(supplyTask, "daily lp points");

  if (lock[supplyTask]) return;
  lock[supplyTask] = true;
  try {
    const count = await WalletUserV2.count({});
    await _dailyLpPoints(
      api,
      count,
      supplyTask,
      borrowTask,
      p,
      supplyMultiplier
    );
  } catch (error) {
    console.log(supplyTask, "cron failed beacuse of", error);
  }
  lock[supplyTask] = false;
};

// manta
export const mantaCron = async () => {
  return _dailyLpPointsChain(
    apiManta,
    "supplyManta",
    "borrowManta",
    mantaProvider,
    1
  );
};

// zksync
export const zksyncCron = async () => {
  return _dailyLpPointsChain(
    apiZKSync,
    "supplyZkSync",
    "borrowZkSync",
    zksyncProvider,
    1
  );
};

// blast
export const blastCron = async () => {
  return _dailyLpPointsChain(
    apiBlast,
    "supplyBlast",
    "borrowBlast",
    blastProvider,
    1
  );
};

// linea
export const lineaCron = async () => {
  return _dailyLpPointsChain(
    apiLinea,
    "supplyLinea",
    "borrowLinea",
    lineaProvider,
    1
  );
};

// etherum Lrt
export const ethereumLrtCron = async () => {
  return _dailyLpPointsChain(
    apiEth,
    "supplyEthereumLrt",
    "borrowEthereumLrt",
    ethLrtProvider,
    1
  );
};

// xlayer
export const xLayerCron = async () => {
  return _dailyLpPointsChain(
    apiXLayer,
    "supplyXLayer",
    "borrowXLayer",
    xLayerProvider,
    2
  );
};
