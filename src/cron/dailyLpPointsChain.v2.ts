import { UserPointTransactions } from "../database/models/userPointTransactions";
import {
  IAssignPointsTask,
  assignPointsV2,
} from "../controller/quests/assignPoints";
import nconf from "nconf";
import _ from "underscore";
import { supplyBorrowPointsMulticall } from "../controller/quests/onChainPoints";
import {
  ITaskName,
  IWalletUserModel,
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
  task: keyof ITaskName,
  poolAddr: string,
  p: AbstractProvider,
  supplyMultiplier: number
) => {
  try {
    // get wallets
    const wallets = userBatch.map((u) => u.walletAddress);

    // get manta data
    // const mantaData = await supplyBorrowPointsMantaMulticall(wallets);
    console.log("got", task, "for epoch", epoch);
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
          `Daily Supply on ${task} chain for ${d.supply.amount}`,
          true,
          task,
          `${task == "zksync" ? "" : task}Supply`,
          epoch
        );
        if (t) tasks.push(t);
      }

      if (d.borrow.points > 0) {
        const t = await assignPointsV2(
          user,
          d.borrow.points,
          `Daily Borrow on ${task} chain for ${d.borrow.amount}`,
          true,
          task,
          `${task == "zksync" ? "" : task}Borrow`,
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
  task: keyof ITaskName,
  poolAddr: string,
  p: AbstractProvider,
  supplyMultiplier: number
) => {
  const epoch = getEpoch();
  console.log("working with epoch", epoch);

  const query = {
    $or: [
      { [`epochs.${task}`]: 0, isDeleted: false },
      { [`epochs.${task}`]: undefined, isDeleted: false },
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
      await _processBatch(users, epoch, task, poolAddr, p, supplyMultiplier);
    } catch (error) {
      console.log("error", error);
      console.log("failure working with batch", i);
    }
  }

  console.log("done");
};

const lock: { [chain: string]: boolean } = {};
const _dailyLpPointsChain = async (
  task: keyof ITaskName,
  poolAddr: string,
  p: AbstractProvider,
  supplyMultiplier: number
) => {
  console.log(task, "daily lp points");

  if (lock[task]) return;
  lock[task] = true;
  try {
    const count = await WalletUser.count({});
    await _dailyLpPoints(count, task, poolAddr, p, supplyMultiplier);
  } catch (error) {
    console.log(task, "cron failed beacuse of", error);
  }
  lock[task] = false;
};

// manta
export const mantaCron = async () => {
  return _dailyLpPointsChain(
    "manta",
    nconf.get("MANTA_POOL"),
    mantaProvider,
    1
  );
};

// zksync
export const zksyncCron = async () => {
  return _dailyLpPointsChain(
    "zksync",
    nconf.get("ZKSYNC_POOL"),
    zksyncProvider,
    1
  );
};

// blast
export const blastCron = async () => {
  return _dailyLpPointsChain(
    "blast",
    nconf.get("BLAST_POOL"),
    blastProvider,
    1
  );
};

// linea
export const lineaCron = async () => {
  return _dailyLpPointsChain(
    "linea",
    nconf.get("LINEA_POOL"),
    lineaProvider,
    1
  );
};

// etherum Lrt
export const ethereumLrtCron = async () => {
  return _dailyLpPointsChain(
    "eth-lrt",
    nconf.get("ETH_LRT_POOL"),
    ethLrtProvider,
    1
  );
};

// xlayer
export const xLayerCron = async () => {
  return _dailyLpPointsChain(
    "xlayer",
    nconf.get("OKX_POOL"),
    xLayerProvider,
    2
  );
};
