import {
  supplyBorrowPointsGQL,
  votingPowerGQL,
} from "../controller/quests/onChainPoints";
import { IWalletUserPoints } from "../database/interface/walletUser/walletUserPoints";
import { getEpoch } from "../utils/epoch";
import { AbstractProvider } from "ethers";
import {
  IAssignPointsTask,
  assignPointsPerSecondToBatch,
} from "../controller/quests/assignPoints";
import {
  IWalletUserModel,
  WalletUserV2,
} from "../database/models/walletUsersV2";
import {
  mantaProvider,
  zksyncProvider,
  blastProvider,
  lineaProvider,
  ethLrtProvider,
  xLayerProvider,
} from "../utils/providers";
import {
  Multiplier,
  apiBlast,
  apiEth,
  apiLinea,
  apiManta,
  apiXLayer,
  apiZKSync,
  blastMultiplier,
  ethLrtMultiplier,
  lineaMultiplier,
  mantaMultiplier,
  xlayerMultiplier,
  zksyncMultiplier,
} from "../controller/quests/constants";

const _processBatch = async (
  api: string,
  userBatch: IWalletUserModel[],
  epoch: number,
  supplyTask: keyof IWalletUserPoints,
  borrowTask: keyof IWalletUserPoints,
  p: AbstractProvider,
  multiplier: Multiplier
) => {
  try {
    const supplyBorrowData = await supplyBorrowPointsGQL(
      api,
      userBatch,
      p,
      multiplier
    );
    const stakingApi = "";
    const stakeData = await votingPowerGQL(stakingApi, userBatch);
    // update supply points
    const supplyExecutable = await assignPointsPerSecondToBatch(
      userBatch,
      supplyBorrowData.supply,
      supplyTask,
      epoch
    );
    await supplyExecutable?.execute();

    // update borrow points
    const borrowExecutable = await assignPointsPerSecondToBatch(
      userBatch,
      supplyBorrowData.borrow,
      borrowTask,
      epoch
    );

    await borrowExecutable?.execute();

    //update stakingPoints
    const stakingExecutable = await assignPointsPerSecondToBatch(
      userBatch,
      stakeData,
      "stakeLinea",
      epoch
    );

    await stakingExecutable?.execute();
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
  multiplier: Multiplier
) => {
  const epoch = getEpoch();
  console.log("working with epoch", epoch);

  const query = {
    walletAddress: { $exists: true, $ne: null, $not: { $eq: "" } },
    [`epochs.${supplyTask}`]: { $ne: epoch },
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
        multiplier
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
  multiplier: Multiplier
) => {
  if (lock[supplyTask]) return;
  lock[supplyTask] = true;
  try {
    const count = await WalletUserV2.count({});
    await _dailyLpPoints(api, count, supplyTask, borrowTask, p, multiplier);
  } catch (error) {
    console.log(supplyTask, "cron failed because of", error);
  }
  lock[supplyTask] = false;
};

// manta
export const mantaPPSCron = async () => {
  return _dailyLpPointsChain(
    apiManta,
    "supplyManta",
    "borrowManta",
    mantaProvider,
    mantaMultiplier
  );
};

// zksync
export const zksyncPPSCron = async () => {
  return _dailyLpPointsChain(
    apiZKSync,
    "supplyZkSync",
    "borrowZkSync",
    zksyncProvider,
    zksyncMultiplier
  );
};

// blast
export const blastPPSCron = async () => {
  return _dailyLpPointsChain(
    apiBlast,
    "supplyBlast",
    "borrowBlast",
    blastProvider,
    blastMultiplier
  );
};

// linea
export const lineaPPSCron = async () => {
  return _dailyLpPointsChain(
    apiLinea,
    "supplyLinea",
    "borrowLinea",
    lineaProvider,
    lineaMultiplier
  );
};

// etherum Lrt
export const ethereumLrtPPSCron = async () => {
  return _dailyLpPointsChain(
    apiEth,
    "supplyEthereumLrt",
    "borrowEthereumLrt",
    ethLrtProvider,
    ethLrtMultiplier
  );
};

// xlayer
export const xLayerPPSCron = async () => {
  return _dailyLpPointsChain(
    apiXLayer,
    "supplyXLayer",
    "borrowXLayer",
    xLayerProvider,
    xlayerMultiplier
  );
};
