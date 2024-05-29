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

export interface PointsData {
  supply: Map<any, any>;
  borrow: Map<any, any>;
  stake?: Map<any, any>;
}

export const assignPoints = async (
  user: IWalletUserModel,
  points: number,
  message: string,
  isAdd: boolean,
  taskId: keyof IWalletUserPoints,
  epoch?: number
): Promise<IAssignPointsTask | undefined> => {
  if (
    taskId.startsWith("supply") ||
    taskId.startsWith("borrow") ||
    taskId.startsWith("stake")
  ) {
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
              ["pointsPerSecondUpdateTimestamp.referral"]: Date.now(),
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
          [`pointsPerSecondUpdateTimestamp.${taskId}`]: Date.now(),
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

export const assignPointsPerSecondToBatch = async (
  users: IWalletUserModel[],
  pointsData: PointsData,
  epoch: number,
  taskSupply: string,
  taskBorrow: string,
  taskStake?: string
): Promise<IAssignPointsTask | undefined> => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  if (!users || !users.length) return;

  users
    .filter(
      (user) =>
        pointsData.supply.has(user.walletAddress) ||
        pointsData.borrow.has(user.walletAddress) ||
        (pointsData.stake ? pointsData.stake.has(user.walletAddress) : false)
    )
    .forEach((user) => {
      const latestPointsSupply = pointsData.supply.get(user.walletAddress);
      const latestPointsBorrow = pointsData.borrow.get(user.walletAddress);

      const setObj: any = {};
      let stakePointsPerSecond = 0;

      if (pointsData.stake && taskStake && taskStake.startsWith("stake")) {
        const latestPointsStake = pointsData.stake.get(user.walletAddress);
        if (latestPointsStake) {
          stakePointsPerSecond = latestPointsStake / 86400;
        }
        setObj[`pointsPerSecond.${taskStake}`] = stakePointsPerSecond;
        setObj[`epochs.${taskStake}`] = epoch;
      }

      if (latestPointsSupply) {
        const pointsPerSecondSupply: { [key: string]: number } = {};
        const supplyKeys = Object.keys(latestPointsSupply);
        if (supplyKeys.length) {
          supplyKeys.forEach((key) => {
            latestPointsSupply[key]
              ? (pointsPerSecondSupply[`${key}`] =
                  latestPointsSupply[key] / 86400)
              : "";
          });
          setObj[`pointsPerSecond.${taskSupply}`] = pointsPerSecondSupply;
          setObj[`epochs.${taskSupply}`] = epoch;
        }
      }

      if (latestPointsBorrow) {
        const pointsPerSecondBorrow: { [key: string]: number } = {};
        const borrowKeys = Object.keys(latestPointsBorrow);
        if (borrowKeys.length) {
          borrowKeys.forEach((key) => {
            latestPointsBorrow[key]
              ? (pointsPerSecondBorrow[`${key}`] =
                  latestPointsBorrow[key] / 86400)
              : "";
          });
          setObj[`pointsPerSecond.${taskBorrow}`] = pointsPerSecondBorrow;
          setObj[`epochs.${taskBorrow}`] = epoch;
        }
      }
      userBulkWrites.push({
        updateOne: {
          filter: { _id: user.id },
          update: {
            $set: setObj,
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
