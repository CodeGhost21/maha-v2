import { UserPointTransactions } from "../database/models/userPointTransactions";
import {
  IAssignPointsTask,
  assignPoints,
} from "../controller/quests/assignPoints";
import {
  supplyBorrowPointsMantaMulticall,
  supplyBorrowPointsZksyncMulticall,
} from "../controller/quests/onChainPoints";
import _ from "underscore";
import { IWalletUserModel, WalletUser } from "../database/models/walletUsers";
import { getEpoch } from "../utils/epoch";

const _processBatch = async (userBatch: IWalletUserModel[], epoch: number) => {
  // get wallets
  const wallets = userBatch.map((u) => u.walletAddress);

  // get manta data
  const mantaData = await supplyBorrowPointsMantaMulticall(wallets);
  const zksyncData = await supplyBorrowPointsZksyncMulticall(wallets);

  const tasks: IAssignPointsTask[] = [];

  for (let j = 0; j < wallets.length; j++) {
    const user = userBatch[j];
    const zksync = zksyncData[j];
    const manta = mantaData[j];

    console.log(
      "  ",
      j,
      "manta",
      manta.supply.points,
      manta.borrow.points,
      "zks",
      zksync.supply.points,
      zksync.borrow.points
    );

    if (manta.supply.points === 0 && zksync.supply.points === 0) {
      tasks.push({
        userBulkWrites: [
          {
            updateOne: {
              filter: { _id: user.id },
              update: { $set: { epoch } },
            },
          },
        ],
        pointsBulkWrites: [],
        execute: async () => {
          return;
        },
      });
    }

    if (manta.supply.points > 0) {
      const t = await assignPoints(
        user.id,
        manta.supply.points,
        `Daily Supply on manta chain for ${manta.supply.amount}`,
        true,
        "supply",
        epoch
      );
      if (t) tasks.push(t);
    }

    if (manta.borrow.points > 0) {
      const t = await assignPoints(
        user.id,
        manta.borrow.points,
        `Daily Borrow on manta chain for ${manta.borrow.amount}`,
        true,
        "borrow",
        epoch
      );
      if (t) tasks.push(t);
    }

    if (zksync.supply.points > 0) {
      const t = await assignPoints(
        user.id,
        zksync.supply.points,
        `Daily Supply on zksync chain for ${zksync.supply.amount}`,
        true,
        "supply",
        epoch
      );
      if (t) tasks.push(t);
    }

    if (zksync.borrow.points > 0) {
      const t = await assignPoints(
        user.id,
        zksync.borrow.points,
        `Daily Borrow on zksync chain for ${zksync.borrow.amount}`,
        true,
        "borrow",
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
};

const _dailyLpPoints = async (from: number, count: number, migrate = false) => {
  const epoch = getEpoch();
  console.log("working with epoch", epoch);

  const query = migrate
    ? { $or: [{ epoch: 0 }, { epoch: undefined }] }
    : { epoch: { $ne: epoch } };

  // const query = { walletAddress: "0x13FeFdD563A930F07B1aC8A2227Acc27c3C12946" };
  const users = await WalletUser.find(query)
    .limit(count)
    .skip(from)
    .select(["walletAddress"]);

  const chunk = 1000;

  const loops = Math.floor(users.length / chunk) + 1;
  console.log(loops, users.length, from, count);

  for (let i = 0; i < loops; i++) {
    try {
      console.log("working on batch", i);
      const userBatch = users.slice(i * chunk, (i + 1) * chunk);
      await _processBatch(userBatch, epoch);
    } catch (error) {
      console.log("failure workign with batch", i);
    }
  }

  console.log("done");
};

let lock = false;
export const dailyLpPoints = async (migrate = false) => {
  if (lock) return;
  lock = true;

  try {
    const count = await WalletUser.count({});
    await _dailyLpPoints(0, count, migrate);
  } catch (error) {
    console.log("cron failed beacuse of", error);
  }

  lock = false;
};
