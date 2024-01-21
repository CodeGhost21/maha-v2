import { IWalletUser, WalletUser } from "../../database/models/walletUsers";
import {
  IUserPointTransactions,
  UserPointTransactions,
} from "../../database/models/userPointTransactions";
import { referralPercent } from "./constants";
import { AnyBulkWriteOperation } from "mongodb";

export interface IAssignPointsTask {
  userBulkWrites: AnyBulkWriteOperation<IWalletUser>[];
  pointsBulkWrites: AnyBulkWriteOperation<IUserPointTransactions>[];
  execute: () => Promise<void>;
}

export const assignPoints = async (
  userId: string,
  points: number,
  message: string,
  isAdd: boolean,
  taskId: string
): Promise<IAssignPointsTask | undefined> => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const pointsBulkWrites: AnyBulkWriteOperation<IUserPointTransactions>[] = [];

  const user = await WalletUser.findById(userId);
  if (!user) return;

  const previousPoints = Number(user.totalPoints) || 0;
  let latestPoints = Number(points) || 0;
  let newMessage = message;

  if (points < 0.01 || isNaN(points)) return;

  if (user.referredBy) {
    const referredByUser = await WalletUser.findOne({ _id: user.referredBy });
    if (referredByUser) {
      const referralPoints = Number(points * referralPercent) || 0;
      latestPoints = latestPoints + referralPoints;
      newMessage = message + " plus referral points";

      // assign referral points to referred by user
      pointsBulkWrites.push({
        insertOne: {
          document: {
            userId: referredByUser.id,
            previousPoints: referredByUser.points.referral,
            currentPoints: referredByUser.points.referral + referralPoints,
            subPoints: isAdd ? 0 : referralPoints,
            addPoints: !isAdd ? 0 : referralPoints,
            message: "referral points",
          },
        },
      });

      userBulkWrites.push({
        updateOne: {
          filter: { _id: referredByUser.id },
          update: {
            $inc: {
              ["points.referral"]: referralPoints,
              totalPoints: referralPoints,
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
        previousPoints,
        currentPoints: previousPoints + latestPoints,
        subPoints: isAdd ? 0 : latestPoints,
        addPoints: !isAdd ? 0 : latestPoints,
        message: newMessage,
      },
    },
  });

  userBulkWrites.push({
    updateOne: {
      filter: { _id: user.id },
      update: {
        $inc: {
          [`points.${taskId}`]: latestPoints,
          totalPoints: latestPoints,
        },
        $set: {
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
