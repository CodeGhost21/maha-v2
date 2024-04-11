import _ from "underscore";
import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";
dotenv.config();
nconf
  .argv()
  .env()
  .file({ file: path.resolve("./config.json") });
import { open } from "../database";

open();

import { WalletUser } from "../database/models/walletUsers";
import { UserPointTransactions } from "../database/models/userPointTransactions";
import {
  assignPoints,
  IAssignPointsTask,
} from "../controller/quests/assignPoints";
import { getEpoch } from "../utils/epoch";
import { withoutDays, withDays } from "./updateList/LPList";

const updateLpPoints = async () => {
  const addresses: any = withoutDays.map((i) => i.address);
  const result = await WalletUser.find({
    walletAddress: { $in: addresses },
    isDeleted: false,
  });
  const epoch = getEpoch();
  const wallets = result.map((u) => u.walletAddress);
  const tasks: IAssignPointsTask[] = [];
  const existingUsers = result.map((user: any) => {
    const createdAtDate = new Date(user.createdAt);
    const today = new Date();
    const differenceInTime = today.getTime() - createdAtDate.getTime();
    // Calculate the difference in days
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return {
      userId: user._id,
      walletAddress: user.walletAddress,
      supply: user.points.supply || 0,
      borrow: user.points.borrow || 0,
      createdAt: user.createdAt,
      currentDate: today,
      days: Math.ceil(differenceInDays) + 1,
    };
  });
  for (let i = 0; i < wallets.length; i++) {
    const onChainData: any = withoutDays.find(
      (obj) => existingUsers[i].walletAddress === obj.address
    );

    if (existingUsers[i].supply === 0 && existingUsers[i].borrow === 0) {
      if (onChainData.manta.supply > 0) {
        const t = await assignPoints(
          existingUsers[i].userId,
          onChainData.manta.supply * existingUsers[i].days,
          `Adjusted ${existingUsers[i].days} days of ${
            onChainData.manta.supply * existingUsers[i].days
          } points of Supply on manta chain for ${onChainData.manta.supply}`,
          true,
          "supply",
          epoch
        );
        if (t) tasks.push(t);
      }
      //manta borrow
      if (onChainData.manta.borrow > 0) {
        const t = await assignPoints(
          existingUsers[i].userId,
          onChainData.manta.borrow * existingUsers[i].days * 4,
          `Adjusted ${existingUsers[i].days} days of ${
            onChainData.manta.borrow * existingUsers[i].days * 4
          } points of Borrow on manta chain for ${onChainData.manta.borrow}`,
          true,
          "supply",
          epoch
        );
        if (t) tasks.push(t);
      }
      //zksync supply
      if (onChainData.zksync.supply > 0) {
        const t = await assignPoints(
          existingUsers[i].userId,
          onChainData.zksync.supply * existingUsers[i].days,
          `Adjusted ${existingUsers[i].days} days of ${
            onChainData.zksync.supply * existingUsers[i].days
          } points of Supply on zksync chain for ${onChainData.zksync.supply}`,
          true,
          "supply",
          epoch
        );
        if (t) tasks.push(t);
      }
      //zksync borrow
      if (onChainData.zksync.borrow > 0) {
        const t = await assignPoints(
          existingUsers[i].userId,
          onChainData.zksync.borrow * existingUsers[i].days * 4,
          `Adjusted ${existingUsers[i].days} days of ${
            onChainData.zksync.borrow * existingUsers[i].days * 4
          } points of Borrow on zksync chain for ${onChainData.zksync.borrow}`,
          true,
          "supply",
          epoch
        );
        if (t) tasks.push(t);
      }
    }
  }
  await WalletUser.bulkWrite(_.flatten(tasks.map((r) => r.userBulkWrites)));
  await UserPointTransactions.bulkWrite(
    _.flatten(tasks.map((r) => r.pointsBulkWrites))
  );
};

// updateLpPoints();

const temp = async () => {
  const addresses: any = withDays.map((i) => i.address);
  const result = await WalletUser.find({
    walletAddress: { $in: addresses },
    isDeleted: false,
  });
  const epoch = getEpoch();
  const wallets = result.map((u) => u.walletAddress);
  const tasks: IAssignPointsTask[] = [];
  const existingUsers = result.map((user: any) => {
    return {
      userId: user._id,
      walletAddress: user.walletAddress,
      supply: user.points.supply || 0,
      borrow: user.points.borrow || 0,
      createdAt: user.createdAt,
    };
  });
  for (let i = 0; i < wallets.length; i++) {
    const onChainData: any = withDays.find(
      (obj) => existingUsers[i].walletAddress === obj.address
    );
    if (onChainData.manta.supply > 0) {
      const t = await assignPoints(
        existingUsers[i].userId,
        onChainData.manta.supply * onChainData.days,
        `Adjusted ${onChainData.days} days of ${
          onChainData.manta.supply * onChainData.days
        } points of Supply on manta chain for ${onChainData.manta.supply}`,
        true,
        "supply",
        epoch
      );
      if (t) tasks.push(t);
    }
    //manta borrow
    if (onChainData.manta.borrow > 0) {
      const t = await assignPoints(
        existingUsers[i].userId,
        onChainData.manta.borrow * onChainData.days * 4,
        `Adjusted ${onChainData.days} days of ${
          onChainData.manta.borrow * onChainData.days * 4
        } points of Borrow on manta chain for ${onChainData.manta.borrow}`,
        true,
        "supply",
        epoch
      );
      if (t) tasks.push(t);
    }
    //zksync supply
    if (onChainData.zksync.supply > 0) {
      const t = await assignPoints(
        existingUsers[i].userId,
        onChainData.zksync.supply * onChainData.days,
        `Adjusted ${onChainData.days} days of ${
          onChainData.zksync.supply * onChainData.days
        } points of Supply on zksync chain for ${onChainData.zksync.supply}`,
        true,
        "supply",
        epoch
      );
      if (t) tasks.push(t);
    }
    //zksync borrow
    if (onChainData.zksync.borrow > 0) {
      const t = await assignPoints(
        existingUsers[i].userId,
        onChainData.zksync.borrow * onChainData.days * 4,
        `Adjusted ${onChainData.days} days of ${
          onChainData.zksync.borrow * onChainData.days * 4
        } points of Borrow on zksync chain for ${onChainData.zksync.borrow}`,
        true,
        "supply",
        epoch
      );
      if (t) tasks.push(t);
    }
  }

  // await WalletUser.bulkWrite(_.flatten(tasks.map((r) => r.userBulkWrites)));
  // await UserPointTransactions.bulkWrite(
  //   _.flatten(tasks.map((r) => r.pointsBulkWrites))
  // );
  // console.log("done");
};

// temp();
