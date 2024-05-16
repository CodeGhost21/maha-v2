import {
  IWalletUserModel,
  WalletUserV2,
} from "../database/models/walletUsersV2";
import { AnyBulkWriteOperation } from "mongodb";
import { referralPercent } from "../controller/quests/constants";
import { IWalletUser } from "../database/interface/walletUser/walletUser";
import { IWalletUserPoints } from "../database/interface/walletUser/walletUserPoints";
import { IAsset } from "../database/interface/walletUser/assets";
import { IUserPointTransactions } from "src/database/interface/userPoints/userPointsTransactions";

export const updateLPPointsHourly = async () => {
  console.log("updateLPPointsHourly");

  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const pointsBulkWrite: AnyBulkWriteOperation<IUserPointTransactions>[] = [];
  const batchSize = 1000;
  const t1 = Date.now();

  let skip = 0;
  let batch;

  console.log("----- user skip ----", skip);
  console.log("----- start time for user skip ----", t1);

  do {
    batch = await WalletUserV2.find().skip(skip).limit(batchSize);

    for (const user of batch) {
      let referredByUser = {} as IWalletUserModel;
      if (user.referredBy) {
        referredByUser = await WalletUserV2.findOne({
          _id: user.referredBy,
        }).select("id totalPoints points");
      }
      const userLpTasksKeys = Object.keys(user.pointsPerSecond) as Array<
        keyof IWalletUserPoints
      >;
      console.log("userLpTasksKeys", userLpTasksKeys);
      // await Promise.all(
      // each LP task
      userLpTasksKeys.map((lpTask) => {
        console.log("task---------", lpTask);
        const assetPointsPerSecond = user.pointsPerSecond[lpTask] as IAsset;
        console.log("assetPointsPerSecond", assetPointsPerSecond);
        console.log(
          "user.pointsPerSecond[lpTask]",
          user.pointsPerSecond[lpTask]
        );
        const assetPointsPerSecondKeys = Object.keys(
          assetPointsPerSecond
        ) as Array<keyof IAsset>;

        if (assetPointsPerSecondKeys.length) {
          const _points: Partial<IWalletUserPoints> = {
            [lpTask]: {} as IAsset,
          };
          const _pointsPerSecondUpdateTimestamp: { [key: string]: number } = {};
          let _totalPoints = 0;
          let referralPoints = 0;

          // each asset
          assetPointsPerSecondKeys.map((asset) => {
            const pointsPerSecondUpdateTimestamp = user
              .pointsPerSecondUpdateTimestamp[lpTask] as IAsset;
            // asset level calculations
            const timestamp = pointsPerSecondUpdateTimestamp
              ? Number(pointsPerSecondUpdateTimestamp[asset])
              : 0;
            console.log("timestamp", timestamp);
            const pointsPerSecond = Number(assetPointsPerSecond[asset]) || 0;
            console.log("pointsPerSecond", pointsPerSecond);
            const timeElapsed =
              timestamp <= 0 ? 0 : (Date.now() - timestamp) / 1000;
            const newPoints = Number(pointsPerSecond * timeElapsed);
            console.log("newPoints", newPoints);
            if (newPoints > 0) {
              const refPointForAsset =
                timestamp > 0 ? Number(newPoints * referralPercent) : 0;
              if (referredByUser && Object.keys(referredByUser).length) {
                referralPoints += refPointForAsset;
              }

              const pointsToAdd =
                timestamp > 0 ? newPoints + refPointForAsset : 0;
              (_points[lpTask] as IAsset)[asset] = pointsToAdd;
              console.log("points1------", _points);
              _totalPoints += pointsToAdd;
            }
            _pointsPerSecondUpdateTimestamp[`${asset}`] = Date.now();
          });
          console.log("points", _points);
          if (referredByUser && Object.keys(referredByUser).length) {
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

            pointsBulkWrite.push({
              insertOne: {
                document: {
                  userId: referredByUser.id,
                  previousPoints: referredByUser.totalPoints,
                  currentPoints: referredByUser.totalPoints + referralPoints,
                  subPoints: 0,
                  addPoints: referralPoints,
                  message: "Referral Points",
                },
              },
            });
          }

          userBulkWrites.push({
            updateOne: {
              filter: { _id: user.id },
              update: {
                $inc: {
                  ...Object.keys(_points[lpTask] as IAsset).reduce(
                    (acc, key) => {
                      acc[`points.${lpTask}.${key}`] = (
                        _points[lpTask] as IAsset
                      )[key as keyof IAsset] || 0;
                      return acc;
                    },
                    {} as Record<string, number>
                  ),
                  totalPoints: _totalPoints,
                },
                $set: {
                  [`pointsPerSecondUpdateTimestamp.${lpTask}`]:
                    _pointsPerSecondUpdateTimestamp,
                },
              },
            },
          });

          pointsBulkWrite.push({
            insertOne: {
              document: {
                userId: user.id,
                previousPoints: user.totalPoints,
                currentPoints: user.totalPoints + _totalPoints,
                subPoints: 0,
                addPoints: _totalPoints,
                message: `${lpTask} points`,
              },
            },
          });
        }
      });
      // );
    }

    await WalletUserV2.bulkWrite(userBulkWrites);
    skip += batchSize;
  } while (batch.length === batchSize);

  console.log("----- user skip ----", skip);
  console.log("----- End time for user skip ----", Date.now());
  console.log("----- final time to complete-----", Date.now() - t1);
};
