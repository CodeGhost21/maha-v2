import { AnyBulkWriteOperation } from "mongodb";

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
import { IAssignPointsTask } from "../controller/quests/assignPoints";

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
  let newMessage = message;
  let points = latestPoints;
  if (user.referredBy) {
    const referredByUser = await WalletUser.findOne({
      _id: user.referredBy,
      isDeleted: false,
    });
    if (referredByUser) {
      const newReferralPoints = Number(latestPoints * referralPercent) || 0;
      points = points + newReferralPoints;
      newMessage = message + " plus referral points";
      const refPoints = (referredByUser.points || {}).referral || 0;
      pointsBulkWrites.push({
        insertOne: {
          document: {
            userId: referredByUser.id,
            previousPoints: refPoints,
            currentPoints:
              refPoints + (newReferralPoints - previousReferralPoints),
            addPoints: isAdd
              ? 0
              : Math.abs(newReferralPoints - previousReferralPoints),
            subPoints: !isAdd
              ? 0
              : Math.abs(newReferralPoints - previousReferralPoints),
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
          [`pointsUpdateTimestamp.${taskId}`]: Date.now(),
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
