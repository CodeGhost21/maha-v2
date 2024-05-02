import { UserPointTransactions } from "../database/models/userPointTransactions";
import {
  IAssignPointsTask,
  assignPointsV2,
} from "../controller/quests/assignPoints";
import nconf from "nconf";
import _ from "underscore";
import { supplyBorrowPointsMulticall } from "../controller/quests/onChainPoints";
import {
  IWalletUserModel,
  IWalletUserPoints,
  WalletUser,
} from "../database/models/walletUsers";
import { getEpoch } from "../utils/epoch";
import { AbstractProvider } from "ethers";

import {
  mantaProvider,
  zksyncProvider,
  blastProvider,
  lineaProvider,
  ethLrtProvider,
  xLayerProvider,
} from "../utils/providers";

const _processBatch = async (
  userBatch: IWalletUserModel[],
  epoch: number,
  supplyTask: keyof IWalletUserPoints,
  borrowTask: keyof IWalletUserPoints,
  poolAddr: string,
  p: AbstractProvider,
  supplyMultiplier: number
) => {
  try {
    // get wallets
    const wallets = userBatch.map((u) => u.walletAddress);

    // get manta data
    // const mantaData = await supplyBorrowPointsMantaMulticall(wallets);
    // console.log("got", task, "for epoch", epoch);
    const data = await supplyBorrowPointsMulticall(
      wallets,
      poolAddr,
      p,
      supplyMultiplier
    );

    // console.log(data);

    const tasks: IAssignPointsTask[] = [];

    for (let j = 0; j < wallets.length; j++) {
      const user = userBatch[j];
      const d = data[j];

      if (d.supply.points > 0) {
        const t = await assignPointsV2(
          user,
          d.supply.points,
          `Daily Supply on ${supplyTask} chain for ${d.supply.amount}`,
          true,
          supplyTask,
          epoch
        );
        if (t) tasks.push(t);
      }

      if (d.borrow.points > 0) {
        const t = await assignPointsV2(
          user,
          d.borrow.points,
          `Daily Borrow on ${borrowTask} chain for ${d.borrow.amount}`,
          true,
          borrowTask,
          epoch
        );
        if (t) tasks.push(t);
      }
    }

    // once all the db operators are accumulated; write into the DB
    await WalletUser.bulkWrite(_.flatten(tasks.map((r) => r.userBulkWrites)));
    await UserPointTransactions.bulkWrite(
      _.flatten(tasks.map((r) => r.pointsBulkWrites))
    );

    console.log("done with batch", tasks.length);
  } catch (error) {
    console.log("processBatch error", error);
  }
};

const _dailyLpPoints = async (
  count: number,
  supplyTask: keyof IWalletUserPoints,
  borrowTask: keyof IWalletUserPoints,
  poolAddr: string,
  p: AbstractProvider,
  supplyMultiplier: number
) => {
  const epoch = getEpoch() - 2;
  console.log("working with epoch", epoch);

  const query = {
    $or: [
      { [`epochs.${supplyTask}`]: 0, isDeleted: false },
      { [`epochs.${supplyTask}`]: undefined, isDeleted: false },
    ],
  };

  const chunk = 1000;
  const loops = Math.floor(count / chunk) + 1;

  for (let i = 0; i < loops; i++) {
    try {
      const users = await WalletUser.find(query)
        .limit(chunk)
        .skip(i * chunk)
        .select(["walletAddress", "totalPointsV2", "referredBy"]);

      console.log("working on batch", i);
      await _processBatch(
        users,
        epoch,
        supplyTask,
        borrowTask,
        poolAddr,
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
  supplyTask: keyof IWalletUserPoints,
  borrowTask: keyof IWalletUserPoints,
  poolAddr: string,
  p: AbstractProvider,
  supplyMultiplier: number
) => {
  console.log(supplyTask, "daily lp points");

  if (lock[supplyTask]) return;
  lock[supplyTask] = true;
  try {
    const count = await WalletUser.count({});
    await _dailyLpPoints(
      count,
      supplyTask,
      borrowTask,
      poolAddr,
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
    "supplyManta",
    "borrowManta",
    nconf.get("MANTA_POOL"),
    mantaProvider,
    1
  );
};

// zksync
export const zksyncCron = async () => {
  return _dailyLpPointsChain(
    "supply",
    "borrow",
    nconf.get("ZKSYNC_POOL"),
    zksyncProvider,
    1
  );
};

// blast
export const blastCron = async () => {
  return _dailyLpPointsChain(
    "supplyBlast",
    "borrowBlast",
    nconf.get("BLAST_POOL"),
    blastProvider,
    1
  );
};

// linea
export const lineaCron = async () => {
  return _dailyLpPointsChain(
    "supplyLinea",
    "borrowLinea",
    nconf.get("LINEA_POOL"),
    lineaProvider,
    1
  );
};

// etherum Lrt
export const ethereumLrtCron = async () => {
  return _dailyLpPointsChain(
    "supplyEthereumLrt",
    "borrowEthereumLrt",
    nconf.get("ETH_LRT_POOL"),
    ethLrtProvider,
    1
  );
};

// xlayer
export const xLayerCron = async () => {
  return _dailyLpPointsChain(
    "supplyXLayer",
    "borrowXLayer",
    nconf.get("OKX_POOL"),
    xLayerProvider,
    2
  );
};
