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
    .select(["totalPoints", "totalPointsV2", "points"])
    .limit(count)
    .skip(from);

  const tx = await WalletUser.bulkWrite(
    users.map((user) => {
      const points = user.points || {};
      const totalPointsV2 =
        (points.borrow || 0) +
        (points.supply || 0) +
        (points.discordFollow || 0) +
        (points.gm || 0) +
        (points.referral || 0);

      // @ts-ignore
      const oldPoints = Math.max(totalPointsV2, Number(user.totalPoints || 0));

      console.log(
        "fuc",
        oldPoints,
        totalPointsV2,
        // @ts-ignore
        Number(user.totalPoints || 0)
      );

      // // diff valued in case
      // if (totalPointsV2 !== user.totalPointsV2)
      //   console.log(
      //     "diff",
      //     user,
      //     user.id,
      //     totalPointsV2,
      //     user.totalPointsV2,
      //     totalPointsV2 - user.totalPointsV2
      //   );

      return {
        updateOne: {
          filter: { _id: user.id },
          update: { $set: { totalPointsV2: oldPoints } },
        },
      };
    })
  );
  console.log(tx);
};

export const recalculatePoints = async () => {
  const count = await WalletUser.count({});

  const chunk = 10000;
  const loops = Math.floor(count / chunk) + 1;

  for (let i = 0; i < loops; i++) {
    await _recalculatePoints(i * chunk, chunk);
  }
};

recalculatePoints();
