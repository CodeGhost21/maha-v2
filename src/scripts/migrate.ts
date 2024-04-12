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
  const users = await WalletUser.find({ isDeleted: false })
    .limit(count)
    .skip(from);

  const tx = await WalletUser.bulkWrite(
    users.map((user) => {
      const points = user.points || {};
      const checked = user.checked || {};

      const json: any = user.toJSON();
      points.gm = json.gmPoints || points.gm || 0;
      points.discordFollow =
        json.discordFollowPoints || points.discordFollow || 0;

      checked.gm = json.gmChecked || checked.gm || false;
      checked.discordVerify =
        json.discordVerify || checked.discordVerify || false;
      checked.discordFollow =
        json.discordFollowChecked || checked.discordFollow || false;

      return {
        updateOne: {
          filter: { _id: user.id },
          update: { $set: { points, checked, epoch: 0 } },
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
