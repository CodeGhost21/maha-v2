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
import { WalletUserV2 } from "../database/models/walletUsersV2";

export const migrateUsers = async () => {
  const batchSize = 100;
  let skip = 0;
  let batch;
  do {
    batch = await WalletUser.find({
      isDeleted: false,
    })
      .select("walletAddress discordId referralCode referredBy role rank")
      .skip(skip)
      .limit(batchSize);

    batch.forEach((user) => {
      console.log(user);

      console.log(user.walletAddress, user.id);
    });
    try {
      await WalletUserV2.ensureIndexes();
      await WalletUserV2.insertMany(batch, { ordered: false });
      skip += batchSize;
    } catch (e) {
      console.log(e);
    }
  } while (batch.length === batchSize);
};
migrateUsers();
