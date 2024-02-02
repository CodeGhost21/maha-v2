import _ from "underscore";
import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";
import { WalletUser } from "../database/models/walletUsers";
import { IPythStaker } from "../controller/interface/IPythStaker";
import pythAddresses from "../addresses/pyth.json";
import {
  IAssignPointsTask,
  assignPoints,
} from "../controller/quests/assignPoints";
import { UserPointTransactions } from "../database/models/userPointTransactions";

dotenv.config();
nconf
  .argv()
  .env()
  .file({ file: path.resolve("./config.json") });

import { open } from "../database";

open();

export const updatePythPoints = async () => {
  const batchSize = 1;
  let skip = 0;
  let batch;

  do {
    batch = await WalletUser.find({}).skip(skip).limit(batchSize); // Use lean() to get plain JavaScript objects instead of Mongoose documents
    console.log("batch", batch);

    const typedAddresses: IPythStaker[] = pythAddresses as IPythStaker[];
    const tasks: IAssignPointsTask[] = [];
    for (const user of batch) {
      const pythData = typedAddresses.find(
        (item) =>
          item.evm.toLowerCase().trim() ===
          user.walletAddress.toLowerCase().trim()
      );

      if (pythData) {
        console.log(pythData.stakedAmount / 1e6, user.points.PythStaker);
        const stakedAmountDiff = user.points.PythStaker
          ? pythData.stakedAmount / 1e6 - user.points.PythStaker
          : 0;
        // console.log("stakedAmountDiff", stakedAmountDiff);

        if (stakedAmountDiff !== 0) {
          user.points.PythStaker = pythData.stakedAmount / 1e6;
          // console.log("before", user.totalPointsV2);
          user.totalPointsV2 += stakedAmountDiff;
          // console.log("after", user.totalPointsV2);

          //task to update user and points
          tasks.push({
            userBulkWrites: [
              {
                updateOne: {
                  filter: { _id: user._id },
                  update: {
                    $set: {
                      "points.PythStaker": user.points.PythStaker,
                      totalPointsV2: user.totalPointsV2,
                    },
                  },
                },
              },
            ],
            pointsBulkWrites: [],
            execute: async () => {
              return;
            },
          });

          //task to assign points
          const pointsAction = stakedAmountDiff > 0 ? "added" : "subtracted";
          const pointsMessage = `${pointsAction} ${Math.abs(
            stakedAmountDiff
          )} PythStaker points from user ${user.walletAddress}`;
          const t = await assignPoints(
            user.id,
            stakedAmountDiff,
            pointsMessage,
            true,
            "PythStaker"
          );
          if (t) tasks.push(t);
        }
      }
    }
    // console.log("tasks", tasks);
    await WalletUser.bulkWrite(_.flatten(tasks.map((r) => r.userBulkWrites)));
    await UserPointTransactions.bulkWrite(
      _.flatten(tasks.map((r) => r.pointsBulkWrites))
    );
    skip += batchSize;
  } while (batch.length === batchSize);
};

updatePythPoints();
