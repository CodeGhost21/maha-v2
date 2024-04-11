import _ from "underscore";
import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";

dotenv.config();
nconf
  .argv()
  .env()
  .file({ file: path.resolve("./config.json") });

import { open } from "../database";

open();

import { WalletUser } from "../database/models/walletUsers";

const updateDiscordPoints = async () => {
  const discordPoints = 100;
  const referralPoints = 20;

  const batchSize = 100;
  const skip = 0;
  let batch;
  do {
    batch = await WalletUser.find({ isDeleted: false })
      .skip(skip)
      .limit(batchSize);
    for (const user of batch) {
      const previousDiscordFollowPoints =
        Number(user.points.discordFollow) || 0;
      let previousReferralPoints = 0;
      let actualPoints = discordPoints;
      if (previousDiscordFollowPoints > 0) {
        if (user.referredBy && user.points.discordFollow > 120) {
          previousReferralPoints = previousDiscordFollowPoints / 1.2;
          actualPoints = discordPoints + referralPoints;
        }
        console.log(
          user.walletAddress,
          previousDiscordFollowPoints,
          previousReferralPoints
        );

        const pointsDifference =
          previousDiscordFollowPoints - previousReferralPoints - discordPoints;

        console.log(pointsDifference);
      }
    }
  } while (batch.length === batchSize);
};

updateDiscordPoints();
