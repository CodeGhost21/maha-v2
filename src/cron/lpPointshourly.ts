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
      await Promise.all(
        // each LP task
        userLpTasksKeys.map(async (lpTask) => {
          const assetPointsPerSecond = user.pointsPerSecond[lpTask] as IAsset;
          const assetPointsPerSecondKeys = Object.keys(
            assetPointsPerSecond
          ) as Array<keyof IAsset>;

          if (assetPointsPerSecondKeys.length) {
            const _points: { [key: string]: number } = {};
            const _pointsPerSecondUpdateTimestamp: { [key: string]: number } =
              {};
            let _totalPoints = 0;
            let referralPoints = 0;

            // each asset
            assetPointsPerSecondKeys.map(async (asset) => {
              const pointsPerSecondUpdateTimestamp = user
                .pointsPerSecondUpdateTimestamp[lpTask] as IAsset;
              // asset level calculations
              const timestamp = Number(
                pointsPerSecondUpdateTimestamp[asset] || 0
              );
              const pointsPerSecond = Number(assetPointsPerSecond[asset] || 0);
              const timeElapsed =
                timestamp <= 0 ? 0 : (Date.now() - timestamp) / 1000;
              const newPoints = Number(pointsPerSecond * timeElapsed);

              if (newPoints > 0) {
                const refPointForAsset =
                  timestamp > 0 ? Number(newPoints * referralPercent) : 0;
                if (Object.keys(referredByUser).length) {
                  referralPoints += refPointForAsset;
                }

                const pointsToAdd =
                  timestamp > 0 ? newPoints + refPointForAsset : 0;

                _points[`points.${lpTask}.${asset}`] = pointsToAdd;
                _totalPoints += pointsToAdd;
                _pointsPerSecondUpdateTimestamp[
                  `pointsPerSecondUpdateTimestamp.${lpTask}.${asset}`
                ] = Date.now();
              }
            });

            if (Object.keys(referredByUser).length) {
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
                    ..._points,
                    totalPoints: _totalPoints,
                  },
                  $set: _pointsPerSecondUpdateTimestamp,
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
        })
      );
    }

    await WalletUserV2.bulkWrite(userBulkWrites);
    skip += batchSize;
  } while (batch.length === batchSize);

  console.log("----- user skip ----", skip);
  console.log("----- End time for user skip ----", Date.now());
  console.log("----- final time to complete-----", Date.now() - t1);
};
