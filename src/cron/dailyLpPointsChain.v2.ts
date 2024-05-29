import {
  supplyBorrowPointsGQL,
  votingPowerGQL,
} from "../controller/quests/onChainPoints";
import { IWalletUserPoints } from "../database/interface/walletUser/walletUserPoints";
import { getEpoch } from "../utils/epoch";
import { AbstractProvider } from "ethers";
import {
  IAssignPointsTask,
  PointsData,
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
  apiStakeLinea,
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
  p: AbstractProvider,
  multiplier: Multiplier,
  supplyTask: keyof IWalletUserPoints,
  borrowTask: keyof IWalletUserPoints,
  stakeTask?: keyof IWalletUserPoints
) => {
  try {
    const pointsData: PointsData = await supplyBorrowPointsGQL(
      api,
      userBatch,
      p,
      multiplier
    );

    if (stakeTask) {
      const stakeData = await votingPowerGQL(apiStakeLinea, userBatch);
      pointsData.stake = stakeData;
    }
    // update supply borrow and stake points
    const dbExecutable = await assignPointsPerSecondToBatch(
      userBatch,
      pointsData,
      epoch,
      borrowTask,
      supplyTask,
      stakeTask
    );
    await dbExecutable?.execute();
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
  p: AbstractProvider,
  multiplier: Multiplier,
  supplyTask: keyof IWalletUserPoints,
  borrowTask: keyof IWalletUserPoints,
  stakeTask?: keyof IWalletUserPoints
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
      stakeTask
        ? await _processBatch(
            api,
            users,
            epoch,
            p,
            multiplier,
            supplyTask,
            borrowTask,
            stakeTask
          )
        : await _processBatch(
            api,
            users,
            epoch,
            p,
            multiplier,
            supplyTask,
            borrowTask
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
  p: AbstractProvider,
  multiplier: Multiplier,
  supplyTask: keyof IWalletUserPoints,
  borrowTask: keyof IWalletUserPoints,
  stakeTask?: keyof IWalletUserPoints
) => {
  if (lock[supplyTask]) return;
  lock[supplyTask] = true;
  try {
    const count = await WalletUserV2.count({});
    stakeTask
      ? await _dailyLpPoints(
          api,
          count,
          p,
          multiplier,
          supplyTask,
          borrowTask,
          stakeTask
        )
      : await _dailyLpPoints(api, count, p, multiplier, supplyTask, borrowTask);
  } catch (error) {
    console.log(supplyTask, "cron failed because of", error);
  }
  lock[supplyTask] = false;
};

// manta
export const mantaPPSCron = async () => {
  return _dailyLpPointsChain(
    apiManta,
    mantaProvider,
    mantaMultiplier,
    "supplyManta",
    "borrowManta"
  );
};

// zksync
export const zksyncPPSCron = async () => {
  return _dailyLpPointsChain(
    apiZKSync,
    zksyncProvider,
    zksyncMultiplier,
    "supplyZkSync",
    "borrowZkSync"
  );
};

// blast
export const blastPPSCron = async () => {
  return _dailyLpPointsChain(
    apiBlast,
    blastProvider,
    blastMultiplier,
    "supplyBlast",
    "borrowBlast"
  );
};

// linea
export const lineaPPSCron = async () => {
  return _dailyLpPointsChain(
    apiLinea,
    lineaProvider,
    lineaMultiplier,
    "supplyLinea",
    "borrowLinea",
    "stakeLinea"
  );
};

// etherum Lrt
export const ethereumLrtPPSCron = async () => {
  return _dailyLpPointsChain(
    apiEth,
    ethLrtProvider,
    ethLrtMultiplier,
    "supplyEthereumLrt",
    "borrowEthereumLrt"
  );
};

// xlayer
export const xLayerPPSCron = async () => {
  return _dailyLpPointsChain(
    apiXLayer,
    xLayerProvider,
    xlayerMultiplier,
    "supplyXLayer",
    "borrowXLayer"
  );
};
