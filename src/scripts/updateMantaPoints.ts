import _ from "underscore";
import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";
import { IAssignPointsTask } from "../controller/quests/assignPoints";
import { getMantaStakedData } from "../controller/quests/stakeManta";
import {
  IWalletUser,
  IWalletUserPoints,
  WalletUser,
} from "../database/models/walletUsers";
import {
  IUserPointTransactions,
  UserPointTransactions,
} from "../database/models/userPointTransactions";
import { referralPercent } from "../controller/quests/constants";
import { AnyBulkWriteOperation } from "mongodb";
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

      if (mantaData) {
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

export const updatePoints = async (
  userId: string,
  previousPoints: number,
  latestPoints: number,
  previousReferralPoints: number,
  message: string,
  isAdd: boolean,
  taskId: keyof IWalletUserPoints,
  epoch?: number
): Promise<IAssignPointsTask | undefined> => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const pointsBulkWrites: AnyBulkWriteOperation<IUserPointTransactions>[] = [];

  const user = await WalletUser.findById(userId);
  if (!user) return;
  const userTotalPoints = Number(user.totalPointsV2) || 0;
  //   console.log(userTotalPoints);

  let newMessage = message;
  let points = latestPoints;
  if (user.referredBy) {
    const referredByUser = await WalletUser.findOne({ _id: user.referredBy });
    if (referredByUser) {
      const newReferralPoints = Number(latestPoints * referralPercent) || 0;
      points = points + newReferralPoints;
      newMessage = message + " plus referral points";
      const refPoints = (referredByUser.points || {}).referral || 0;
      //   console.log(141, newReferralPoints - previousReferralPoints);

      pointsBulkWrites.push({
        insertOne: {
          document: {
            userId: referredByUser.id,
            previousPoints: refPoints,
            currentPoints:
              refPoints + (newReferralPoints - previousReferralPoints),
            subPoints: isAdd ? 0 : newReferralPoints - previousReferralPoints,
            addPoints: !isAdd ? 0 : newReferralPoints - previousReferralPoints,
            message: `${isAdd ? "add" : "subtract"} referral points`,
          },
        },
      });

      userBulkWrites.push({
        updateOne: {
          filter: { _id: referredByUser.id },
          update: {
            $inc: {
              ["points.referral"]: newReferralPoints - previousReferralPoints,
              totalPointsV2: newReferralPoints - previousReferralPoints,
            },
          },
        },
      });
    }
  }

  pointsBulkWrites.push({
    insertOne: {
      document: {
        userId: user.id,
        previousPoints: userTotalPoints,
        currentPoints:
          userTotalPoints + points - previousPoints - previousReferralPoints,
        subPoints: isAdd
          ? 0
          : Math.abs(points - previousPoints - previousReferralPoints),
        addPoints: !isAdd
          ? 0
          : Math.abs(points - previousPoints - previousReferralPoints),
        message: newMessage,
      },
    },
  });

  userBulkWrites.push({
    updateOne: {
      filter: { _id: user.id },
      update: {
        $inc: {
          [`points.${taskId}`]:
            points - previousPoints - previousReferralPoints,
          totalPointsV2: points - previousPoints - previousReferralPoints,
        },
        $set: {
          epoch: epoch || user.epoch,
          [`checked.${taskId}`]: true,
        },
      },
    },
  });

  return {
    userBulkWrites,
    pointsBulkWrites,
    execute: async () => {
      await WalletUser.bulkWrite(userBulkWrites);
      await UserPointTransactions.bulkWrite(pointsBulkWrites);
    },
  };
};
