import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";

dotenv.config();
nconf
  .argv()
  .env()
  .file({ file: path.resolve("./config.json") });

import { open } from "../database";
import { WalletUser } from "../database/models/walletUsers";
open();

export const findDuplicateWalletAddresses = async () => {
  try {
    const timestampThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000 * 25);
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
  } catch (error) {
    console.error("Error:", error);
  }
};
// findDuplicateWalletAddresses();
