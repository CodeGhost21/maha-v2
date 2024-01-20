import { WalletUser } from "../database/models/walletUsers";
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

const _recalculatePoints = async (from: number, count: number) => {
  const users = await WalletUser.find({}).limit(count).skip(from);

  const scripts = users.map((user) => ({
    updateOne: {
      filter: { _id: user.id },
      update: {
        $set: {
          totalPoints:
            user.supplyPoints +
            user.borrowPoints +
            user.discordFollowPoints +
            user.referralPoints +
            user.gmPoints,
        },
      },
    },
  }));

  const tx = await WalletUser.bulkWrite(scripts);
  console.log(tx);
};

export const recalculatePoints = async () => {
  const count = await WalletUser.count({});

  const chunk = 1000;
  const loops = Math.floor(count / chunk) + 1;

  for (let i = 0; i < loops; i++) {
    await _recalculatePoints(i * chunk, chunk);
  }
};

recalculatePoints();
