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
  const users = await WalletUser.find({})
    .select(["totalPoints", "points"])
    .limit(count)
    .skip(from);

  const tx = await WalletUser.bulkWrite(
    users.map((user) => {
      const points = user.points || {};
      const totalPoints =
        (points.borrow || 0) +
        (points.supply || 0) +
        (points.discordFollow || 0) +
        (points.gm || 0) +
        (points.referral || 0);

      // diff valued in case
      if (totalPoints !== user.totalPoints)
        console.log(
          "diff",
          user,
          user.id,
          totalPoints,
          user.totalPoints,
          totalPoints - user.totalPoints
        );

      return {
        updateOne: {
          filter: { _id: user.id },
          update: { $set: { totalPoints } },
        },
      };
    })
  );
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
