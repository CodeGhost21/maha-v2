import {
  IWalletUser,
  WalletUser,
  type IWalletUserPoints,
} from "../database/models/walletUsers";
import { AnyBulkWriteOperation } from "mongodb";
import { referralPercent } from "../controller/quests/constants";

export const updateLPPointsHourly = async () => {
  console.log("updateLPPointsHourly");

  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const batchSize = 1000;

  let skip = 0;
  let t1 = Date.now()
  let batch;

  console.log("----- user skip ----", skip)
  console.log("----- start time for user skip ----", t1 )

  do {
    batch = await WalletUser.find({ isDeleted: false })
      .skip(skip)
      .limit(batchSize);

    for (const user of batch) {
      const lpTasks: Array<keyof IWalletUserPoints> = [
        "borrow",
        "borrowBlast",
        "borrowEthereumLrt",
        "borrowLinea",
        "borrowManta",
        "supply",
        "supplyBlast",
        "supplyBlastEzEth",
        "supplyEthereumLrt",
        "supplyEthereumLrtEth",
        "supplyEthereumLrtEzEth",
        "supplyLinea",
        "supplyLineaEzEth",
        "supplyManta",
        "supplyEthereumLrtRsEth",
      ];

      for (const lpTask of lpTasks) {
        if (user.pointsPerSecond[lpTask]) {
          const timestamp = Number(
            user.pointsPerSecondUpdateTimestamp[lpTask] || 0
          );

          const pointsPerSecond = Number(user.pointsPerSecond[lpTask] || 0);
          const timeElapsed = timestamp <=0 ? 0 : (Date.now() - timestamp) / 1000;

          const newPoints = Number(pointsPerSecond * timeElapsed);

          let referralPoints = 0;
          // check and giver referral points with newPoints
          if (user.referredBy) {
            const referredByUser = await WalletUser.findOne({
              _id: user.referredBy,
            });
            if (referredByUser) {
              referralPoints = Number(newPoints * referralPercent) || 0;

              userBulkWrites.push({
                updateOne: {
                  filter: { _id: referredByUser.id },
                  update: {
                    $inc: {
                      ["points.referral"]: timestamp > 0 ? referralPoints : 0,
                      totalPointsV2: timestamp > 0 ? referralPoints : 0,
                    },
                    $set: {
                      ["pointsUpdateTimestamp.referral"]: Date.now(),
                    },
                  },
                },
              });
            }
          }

          userBulkWrites.push({
            updateOne: {
              filter: { _id: user.id },
              update: {
                $inc: {
                  [`points.${lpTask}`]:
                    timestamp > 0 ? newPoints + referralPoints : 0,
                  totalPointsV2: timestamp > 0 ? newPoints + referralPoints : 0,
                },
                $set: {
                  [`pointsPerSecondUpdateTimestamp.${lpTask}`]: Date.now(),
                },
              },
            },
          });
        }
      }
    }

    await WalletUser.bulkWrite(userBulkWrites);
    skip += batchSize;
  } while (batch.length === batchSize);

  console.log("----- user skip ----", skip)
  console.log("----- End time for user skip ----", Date.now())
  console.log("----- final time to complete-----", Date.now() - t1 )
};
