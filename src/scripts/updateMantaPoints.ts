import _ from "underscore";
import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";
import { IAssignPointsTask } from "../controller/quests/assignPoints";
import { getMantaStakedData } from "../controller/quests/stakeManta";
import { WalletUser } from "../database/models/walletUsers";
import { UserPointTransactions } from "../database/models/userPointTransactions";
import { updatePoints } from "./updatePoints";
dotenv.config();
nconf
  .argv()
  .env()
  .file({ file: path.resolve("./config.json") });

import { open } from "../database";

open();

export const updateMantaPoints = async () => {
  const batchSize = 1000;
  let skip = 0;
  let batch;

  do {
    batch = await WalletUser.find({}).skip(skip).limit(batchSize); // Use lean() to get plain JavaScript objects instead of Mongoose documents
    // console.log("batch", batch);
    const tasks: IAssignPointsTask[] = [];
    for (const user of batch) {
      const mantaData: any = await getMantaStakedData(user.walletAddress);
      //   console.log("mantaData", mantaData);
      console.log(mantaData);

      if (mantaData.success) {
        const latestPoints = mantaData.data.totalStakingAmount / 2;
        // console.log("latestPoints", latestPoints);

        const oldMantaPoints = Number(user.points.MantaStaker) || 0;
        // console.log("oldMantaPoints", oldMantaPoints);

        let previousPoints = oldMantaPoints;
        let previousReferralPoints = 0;
        let stakedAmountDiff = latestPoints - oldMantaPoints;
        if (user.referredBy) {
          previousPoints = oldMantaPoints / 1.2;
          previousReferralPoints = previousPoints - oldMantaPoints / 1.2;
          stakedAmountDiff = latestPoints - previousPoints;
        }
        if (stakedAmountDiff !== 0) {
          const pointsAction = stakedAmountDiff > 0 ? "added" : "subtracted";
          const pointsMessage = `${pointsAction} ${Math.abs(
            stakedAmountDiff
          )} MantaStakers points from user ${user.walletAddress}`;
          // console.log(
          //   136,
          //   user.id,
          //   previousPoints,
          //   latestPoints,
          //   previousReferralPoints,
          //   stakedAmountDiff,
          //   pointsMessage,
          //   pointsAction === "added" ? true : false,
          //   "PythStaker"
          // );
          // console.log("message", pointsMessage);
          //assign points logic
          const t = await updatePoints(
            user._id,
            previousPoints,
            latestPoints,
            previousReferralPoints,
            pointsMessage,
            stakedAmountDiff,
            pointsAction === "added" ? true : false,
            "MantaStaker"
          );
          if (t) tasks.push(t);
        } else {
          console.log("no difference");
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

// updateMantaPoints();
