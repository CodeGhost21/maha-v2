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

import { WalletUserV2 } from "../database/models/walletUsersV2";

export const updateRefererCode = async () => {
  const batchSize = 1000;
  let skip = 0;
  let batch;
  do {
    batch = await WalletUserV2.find({
      referredBy: { $exists: true },
      referrerCode: { $exists: false },
    })
      .select("referredBy walletAddress")
      .skip(skip)
      .limit(batchSize);
    console.log("fetched new batch");
    console.log("skipped users", skip);
    await Promise.all(
      batch.map(async (user: any) => {
        const referer = await WalletUserV2.findOne({ _id: user.id }).select(
          "referralCode"
        );
        user.referrerCode = referer?.referralCode[0];
        await user.save();
      })
    );
    console.log("done with batch\n------------------------------------");
    skip += batchSize;
  } while (batch.length === batchSize);
  console.log("process completed");
  const allReferredBy = await WalletUserV2.find({ referredBy: { $exists: true } }).count();
  const allDone = await WalletUserV2.find({ referrerCode: { $exists: true } }).count();
  if (allDone === allReferredBy) {
    console.log("all users done")
  } else {
    // console.log("please re-run script. few users remaining to update.")
    console.log("re running")
    await updateRefererCode();
  }
};
updateRefererCode();
