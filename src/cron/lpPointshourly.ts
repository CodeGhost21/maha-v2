import { WalletUserV2 } from "../database/models/walletUsersV2";
import { AnyBulkWriteOperation } from "mongodb";
import { referralPercent } from "../controller/quests/constants";
import { IWalletUser } from "src/database/interface/walletUser/walletUser";
import { IWalletUserPoints } from "src/database/interface/walletUser/walletUserPoints";
import { IAsset } from "src/database/interface/walletUser/assets";

export const updateLPPointsHourly = async () => {
  console.log("updateLPPointsHourly");

  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const batchSize = 1000;
  const t1 = Date.now();

  let skip = 0;
  let batch;

  console.log("----- user skip ----", skip);
  console.log("----- start time for user skip ----", t1);

  do {
    batch = await WalletUserV2.find().skip(skip).limit(batchSize);

    for (const user of batch) {
      let referredByUser = null;
      if (user.referredBy) {
        referredByUser = await WalletUserV2.findOne({
          _id: user.referredBy,
        }).select("id");
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
                if (referredByUser) {
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

            if (referredByUser) {
              userBulkWrites.push({
                updateOne: {
                  filter: { _id: referredByUser.id },
                  update: {
                    $inc: {
                      ["points.referral"]: referralPoints,
                      totalPoints: referralPoints
                    },
                    $set: {
                      ["pointsUpdateTimestamp.referral"]: Date.now(),
                    },
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
                  $set: {
                    [`pointsPerSecondUpdateTimestamp.${lpTask}`]: Date.now(),
                  },
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
