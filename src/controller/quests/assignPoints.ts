import {
  ITaskName,
  IWalletUser,
  IWalletUserModel,
  IWalletUserPoints,
  WalletUser,
} from "../../database/models/walletUsers";
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
  taskId: keyof IWalletUserPoints,
  epoch?: number
): Promise<IAssignPointsTask | undefined> => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const pointsBulkWrites: AnyBulkWriteOperation<IUserPointTransactions>[] = [];
  // console.log(taskId, points);

  const user = await WalletUser.findById(userId);
  if (!user) return;

  const previousPoints = Number(user.totalPointsV2) || 0;
  let latestPoints = Number(points) || 0;
  let newMessage = message;

  // if (points < 0.01 || isNaN(points)) return;

  if (user.referredBy) {
    const referredByUser = await WalletUser.findOne({
      _id: user.referredBy,
      isDeleted: false,
    });
    if (referredByUser) {
      const referralPoints = Number(points * referralPercent) || 0;
      latestPoints = latestPoints + referralPoints;
      newMessage = message + " plus referral points";
      const refPoints = (referredByUser.points || {}).referral || 0;

      // assign referral points to referred by user
      pointsBulkWrites.push({
        insertOne: {
          document: {
            userId: referredByUser.id,
            previousPoints: refPoints,
            currentPoints: refPoints + referralPoints,
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
              totalPointsV2: referralPoints,
            },
            $set: {
              ["pointsUpdateTimestamp.referral"]: Date.now(),
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
          totalPointsV2: latestPoints,
        },
        $set: {
          epoch: epoch || user.epoch,
          [`pointsUpdateTimestamp.${taskId}`]: Date.now(),
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

export const assignPointsV2 = async (
  user: IWalletUserModel,
  points: number,
  message: string,
  isAdd: boolean,
  taskId: keyof ITaskName,
  key: string,
  epoch?: number
): Promise<IAssignPointsTask | undefined> => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const pointsBulkWrites: AnyBulkWriteOperation<IUserPointTransactions>[] = [];

  if (!user || !user.id) return;

  const previousPoints = Number(user.totalPointsV2) || 0;
  let latestPoints = Number(points) || 0;
  let newMessage = message;

  if (user.referredBy) {
    const referredByUser = await WalletUser.findOne({
      _id: user.referredBy,
      isDeleted: false,
    }).select(["points", "_id", "id"]);

    if (referredByUser) {
      const referralPoints = Number(points * referralPercent) || 0;
      latestPoints = latestPoints + referralPoints;
      newMessage = message + " plus referral points";
      const refPoints = (referredByUser.points || {}).referral || 0;

      // assign referral points to referred by user
      pointsBulkWrites.push({
        insertOne: {
          document: {
            userId: referredByUser.id,
            previousPoints: refPoints,
            currentPoints: refPoints + referralPoints,
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
              totalPointsV2: referralPoints,
            },
            $set: {
              ["pointsUpdateTimestamp.referral"]: Date.now(),
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

  const epochs = user.epochs || {};
  userBulkWrites.push({
    updateOne: {
      filter: { _id: user.id },
      update: {
        $inc: {
          [`points.${key}`]: latestPoints,
          totalPointsV2: latestPoints,
        },
        $set: {
          epoch: epoch || user.epoch,
          [`pointsUpdateTimestamp.${taskId}`]: Date.now(),
          [`checked.${taskId}`]: true,
          [`epochs.${taskId}`]: epoch || epochs[taskId] || 0,
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
