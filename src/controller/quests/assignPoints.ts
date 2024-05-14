import {
  IWalletUserModel,
  WalletUser,
} from "../../database/models/walletUsers";
import { UserPointTransactions } from "../../database/models/userPointTransactions";
import { referralPercent } from "./constants";
import { AnyBulkWriteOperation } from "mongodb";
import { IWalletUser } from "src/database/interface/walletUser/walletUser";
import { IUserPointTransactions } from "src/database/interface/userPoints/userPointsTransactions";
import { IWalletUserPoints } from "src/database/interface/walletUser/walletUserPoints";

export interface IAssignPointsTask {
  userBulkWrites: AnyBulkWriteOperation<IWalletUser>[];
  // pointsBulkWrites: AnyBulkWriteOperation<IUserPointTransactions>[];
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

  const previousPoints = Number(user.totalPoints) || 0;
  let latestPoints = Number(points) || 0;
  let newMessage = message;

  // if (points < 0.01 || isNaN(points)) return;

  if (user.referredBy) {
    const referredByUser = await WalletUser.findOne({
      _id: user.referredBy,
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
          // [`checked.${taskId}`]: true,
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
  key: keyof IWalletUserPoints,
  epoch?: number
): Promise<IAssignPointsTask | undefined> => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const pointsBulkWrites: AnyBulkWriteOperation<IUserPointTransactions>[] = [];

  if (!user || !user.id) return;

  const previousPoints = Number(user.totalPoints) || 0;
  let latestPoints = Number(points) || 0;
  let newMessage = message;

  if (user.referredBy) {
    const referredByUser = await WalletUser.findOne({
      _id: user.referredBy,
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

  const epochs = user.epochs || {};
  userBulkWrites.push({
    updateOne: {
      filter: { _id: user.id },
      update: {
        $inc: {
          [`points.${key}`]: latestPoints, // points.chain.asset
          totalPoints: latestPoints,
        },
        $set: {
          epoch: epoch || user.epoch,
          [`pointsUpdateTimestamp.${key}`]: Date.now(),
          // [`checked.${key}`]: true,
          [`epochs.${key}`]: epoch || epochs[key] || 0,
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

export const assignPointsToBatch = async (
  users: IWalletUserModel[],
  pointsData: Map<any, any>,
  task: string,
  message: string,
  isAdd: boolean,
  epoch?: number
): Promise<IAssignPointsTask | undefined> => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];

  if (!users || !users.length) return;

  users.map((user) => {
    const latestPoints = pointsData.get(user.walletAddress);
    const Keys = Object.keys(latestPoints);
    const pointsPerSecond: { [key: string]: number } = {};

    if (Keys.length) {
      Keys.forEach((key) => {
        pointsPerSecond[`pointsPerSecond.${task}.${key}`] =
          latestPoints[key] / 86400;
      });
    }

    userBulkWrites.push({
      updateOne: {
        filter: { _id: user.id },
        update: {
          $set: {
            ...pointsPerSecond,
            epoch: epoch || user.epoch,
          },
        },
      },
    });
  });

  return {
    userBulkWrites,
    execute: async () => {
      await WalletUser.bulkWrite(userBulkWrites);
    },
  };
};

// TODO remove below
// export const assignPointsLP = async (
//   userId: string,
//   points: number,
//   isAdd: boolean,
//   taskId: keyof IWalletUserPoints,
//   epoch?: number
// ): Promise<IAssignPointsTask | undefined> => {
//   const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
//   const pointsBulkWrites: AnyBulkWriteOperation<IUserPointTransactions>[] = [];

//   const user = await WalletUser.findById(userId);
//   if (!user) return;

//   const latestPoints = Number(points) || 0;

//   userBulkWrites.push({
//     updateOne: {
//       filter: { _id: user.id },
//       update: {
//         $set: {
//           [`pointsPerSecond.${taskId}`]: latestPoints / 86400,
//           epoch: epoch || user.epoch,
//         },
//       },
//     },
//   });
//   return {
//     userBulkWrites,
//     pointsBulkWrites,
//     execute: async () => {
//       await WalletUser.bulkWrite(userBulkWrites);
//       await UserPointTransactions.bulkWrite(pointsBulkWrites);
//     },
//   };
// };
