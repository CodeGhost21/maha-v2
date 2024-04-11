import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";

dotenv.config();
nconf
  .argv()
  .env()
  .file({ file: path.resolve("./config.json") });

import { open } from "../database";
import { supplyBorrowPointsZksyncMulticall } from "../controller/quests/onChainPoints";
import { WalletUser } from "../database/models/walletUsers";
open();
export const test = async () => {
  try {
    const batchSize = 1000;
    let skip = 0;
    let batch;
    let moreThan10 = 0;
    let moreThan50 = 0;
    let moreThan100 = 0;
    do {
      batch = await WalletUser.find({
        walletAddress: { $exists: true, $ne: null, $not: { $eq: "" } },
      })
        .skip(skip)
        .limit(batchSize);
      const addresses: string[] = batch.map((u) => u.walletAddress); // Map all wallet addresses
      const zksyncData: any = await supplyBorrowPointsZksyncMulticall(
        addresses
      );
      for (let j = 0; j < zksyncData.length; j++) {
        if (zksyncData[j].supply.amount > 10) moreThan10 += 1;
        if (zksyncData[j].supply.amount > 50) moreThan50 += 1;
        if (zksyncData[j].supply.amount > 100) moreThan100 += 1;
      }
      skip += batchSize;
      console.log("moreThan10", moreThan10);
      console.log("moreThan50", moreThan50);
      console.log("moreThan100", moreThan100);
    } while (batch.length === batchSize);

    console.log("final");
    console.log("moreThan10", moreThan10);
    console.log("moreThan50", moreThan50);
    console.log("moreThan100", moreThan100);
  } catch (e) {
    console.log(e);
  }
};

test();

export const findDuplicateWalletAddresses = async () => {
  try {
    const timestampThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000 * 22);
    const duplicates = await WalletUser.aggregate([
      {
        $group: {
          _id: "$walletAddress",
          count: { $sum: 1 },
          createdAt: { $max: "$createdAt" },
        },
      },
      {
        $match: {
          count: { $gt: 1 }, // Filter groups with more than one document
          createdAt: { $gt: timestampThreshold },
        },
      },
    ]);
    console.log("Duplicate wallet addresses:", duplicates);

    // duplicates.map(async(item)=>{
    //   await WalletUser.deleteOne({$and:[{walletAddress:item._id},{createdAt:item.createdAt}]})
    // })

    // const addresses: string[] = duplicates.map((dup) => dup._id);
    // const filter = {
    //   createdAt: { $gte: new Date("2024-03-18T11:00:23.555Z") }, // Example timestamp threshold
    //   walletAddress: {
    //     $in: addresses,
    //   }, // Example wallet addresses
    // };
    // console.log(filter);
  } catch (error) {
    console.error("Error:", error);
  }
};
//  findDuplicateWalletAddresses()
