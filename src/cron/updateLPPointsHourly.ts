import {
  IWalletUser,
  WalletUser,
  type IWalletUserPoints,
} from "../database/models/walletUsers";
import { AnyBulkWriteOperation } from "mongodb";
import { referralPercent } from "../controller/quests/constants";

export const updateLPPointsHourly = async () => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const batchSize = 1000;

  let skip = 0;
  let batch;

  do {
    batch = await WalletUser.find().skip(skip).limit(batchSize);
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
        const timestamp = Number(
          user.pointsPerSecondUpdateTimestamp[lpTask] || 0
        );
        const pointsPerSecond = Number(user.pointsPerSecond[lpTask] || 0);

        const timeElapsed = (Date.now() - timestamp) / 1000;
        const newPoints = Number(pointsPerSecond * timeElapsed || 0);

        if (newPoints <= 0) return;

        // check and giver referral points with newPoints
        if (user.referredBy) {
          const referredByUser = await WalletUser.findOne({
            _id: user.referredBy,
          });

          if (referredByUser) {
            const referralPoints = Number(newPoints * referralPercent) || 0;

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

        userBulkWrites.push({
          updateOne: {
            filter: { _id: user.id },
            update: {
              $inc: {
                [`points.${lpTask}`]: newPoints,
                totalPointsV2: newPoints,
              },
              $set: {
                [`pointsPerSecondUpdateTimestamp.${lpTask}`]: Date.now(),
              },
            },
          },
        });
      }
    }

    await WalletUser.bulkWrite(userBulkWrites);
    skip += batchSize;
  } while (batch.length === batchSize);
};
