import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";
import _ from "underscore";

dotenv.config();
nconf
  .argv()
  .env()
  .file({ file: path.resolve("./config.json") });

import { open } from "../database";
import {
  IWalletUser,
  WalletUser,
  type IWalletUserPoints,
} from "../database/models/walletUsers";
import { AnyBulkWriteOperation } from "mongodb";
import { referralPercent } from "../controller/quests/constants";

open();

export const updateHourlyLPPoints = async () => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const batchSize = 1000;
  let skip = 0;
  let batch;
  do {
    batch = await WalletUser.find().skip(skip).limit(batchSize);
    for (const user of batch) {
      const lpTasks: Array<keyof IWalletUserPoints> = [
        "supply",
        "borrow",
        "supplyManta",
        "borrowManta",
        "supplyLinea",
        "borrowLinea",
        "supplyBlast",
        "borrowBlast",
        "supplyEthereumLrt",
        "borrowEthereumLrt",
        "supplyEthereumLrtEth",
        "supplyLineaEzEth",
        "supplyBlastEzEth",
        "supplyEthereumLrtEzEth",
      ];

      for (const lpTask of lpTasks) {
        const timestamp = Number(
          user.pointsPerSecondUpdateTimestamp[lpTask] || 0
        );
        const pointsPerSecond = Number(user.pointsPerSecond[lpTask] || 0);

        const timeElapsed = (Date.now() - timestamp) / 1000;
        const newPoints = pointsPerSecond * timeElapsed;

        if (typeof newPoints === "number" && newPoints !== 0) {
          // check and giver referral points with newPoints
          if (user.referredBy) {
            const referredByUser = await WalletUser.findOne({
              _id: user.referredBy,
            });
            let latestPoints = Number(newPoints) || 0;
            if (referredByUser) {
              const referralPoints = Number(newPoints * referralPercent) || 0;
              latestPoints = latestPoints + referralPoints;
              // newMessage = message + " plus referral points";
              // const refPoints = (referredByUser.points || {}).referral || 0;

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
    }

    await WalletUser.bulkWrite(userBulkWrites);
    skip += batchSize;
  } while (batch.length === batchSize);
};
updateHourlyLPPoints();
