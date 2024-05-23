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
  const batchSize = 1000;
  let skip = 0;
  let batch;
  do {
    batch = await WalletUser.find({
      isDeleted: false,
    })
      .select("walletAddress discordId referralCode referredBy role rank")
      .skip(skip)
      .limit(batchSize);
    try {
      await WalletUserV2.ensureIndexes();
      await WalletUserV2.insertMany(batch, { ordered: false });
    } catch (e) {
      console.log(e);
    }
    skip += batchSize;
  } while (batch.length === batchSize);
};
migrateUsers();
