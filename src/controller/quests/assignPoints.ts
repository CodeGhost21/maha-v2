import {
  IWalletUserModel,
  WalletUserV2,
} from "../../database/models/walletUsersV2";
import { UserPointTransactions } from "../../database/models/userPointTransactions";
import { referralPercent } from "./constants";
import { AnyBulkWriteOperation } from "mongodb";
import { IWalletUser } from "../../database/interface/walletUser/walletUser";
import { IUserPointTransactions } from "../../database/interface/userPoints/userPointsTransactions";
import { IWalletUserPoints } from "../../database/interface/walletUser/walletUserPoints";

export interface IAssignPointsTask {
  userBulkWrites: AnyBulkWriteOperation<IWalletUser>[];
  pointsBulkWrites?: AnyBulkWriteOperation<IUserPointTransactions>[];
  execute: () => Promise<void>;
}

export const assignPoints = async (
  user: IWalletUserModel,
  points: number,
  message: string,
  isAdd: boolean,
  taskId: keyof IWalletUserPoints,
  epoch?: number
): Promise<IAssignPointsTask | undefined> => {
  if (taskId.startsWith("supply") || taskId.startsWith("borrow")) {
    throw Error("Cannot assign LP points");
  }
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const pointsBulkWrites: AnyBulkWriteOperation<IUserPointTransactions>[] = [];

  const previousPoints = Number(user.totalPoints) || 0;
  let latestPoints = Number(points) || 0;
  let newMessage = message;

  if (user.referredBy) {
    const referredByUser = await WalletUserV2.findOne({
      _id: user.referredBy,
    }).select("points id");
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
              totalPoints: referralPoints,
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
          totalPoints: latestPoints,
        },
        $set: {
          epoch: epoch || user.epoch,
          [`pointsUpdateTimestamp.${taskId}`]: Date.now(),
        },
      },
    },
  });
  return {
    userBulkWrites,
    pointsBulkWrites,
    execute: async () => {
      await WalletUserV2.bulkWrite(userBulkWrites);
      await UserPointTransactions.bulkWrite(pointsBulkWrites);
    },
  };
};

//need to fix this to assign points per second
export const assignPointsPerSecondToBatch = async (
  users: IWalletUserModel[],
  pointsData: Map<any, any>,
  task: string,
  epoch?: number
): Promise<IAssignPointsTask | undefined> => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  console.log("user", users);
  console.log("pointsdata", pointsData);
  if (!users || !users.length) return;

  users
    .filter((user) => pointsData.has(user.walletAddress))
    .map((user) => {
      const latestPoints = pointsData.get(user.walletAddress);
      console.log("user", user);
      console.log("latestPoints", latestPoints);

      const Keys = Object.keys(latestPoints);
      console.log("keys", Keys, "\ntask", task);

      const pointsPerSecond: { [key: string]: number } = {};
      console.log("pointsPerSecond", pointsPerSecond);

      if (Keys.length) {
        Keys.forEach((key) => {
          pointsPerSecond[`${key}`] = latestPoints[key] / 86400;
        });
      }
      console.log("pps", pointsPerSecond);

      userBulkWrites.push({
        updateOne: {
          filter: { _id: user.id },
          update: {
            $set: {
              [`pointsPerSecond.${task}`]: pointsPerSecond,
              epoch: epoch || user.epoch,
            },
          },
        },
      });
    });

  return {
    userBulkWrites,
    execute: async () => {
      await WalletUserV2.bulkWrite(userBulkWrites);
    },
  };
};
