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
import { WalletUserV2 } from "../database/models/walletUsersV2";
open();

export const findDuplicateWalletAddresses = async () => {
  try {
    const timestampThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000 * 25);
    const duplicates = await WalletUser.aggregate([
      {
        $match: {
          isDeleted: false,
        }
      },
      {
        $group: {
          _id: { $toLower: "$walletAddress" },
          count: { $sum: 1 },
          createdAt: { $max: "$createdAt" },
        },
      },
      {
        $match: {
          count: { $gt: 1 }, // Filter groups with more than one document
          // createdAt: { $gt: timestampThreshold },
        },
      },
    ]);
    console.log("Duplicate wallet addresses:", duplicates, duplicates.length);
    for (const user of duplicates) {
      const fetchUsers = await WalletUser.find({ walletAddress: user._id })

      const user1: any = fetchUsers[0]
      const user2: any = fetchUsers[1]

      const user1ReferredBy = await WalletUser.findOne({ referredBy: user1._id })
      const user2ReferredBy = await WalletUser.findOne({ referredBy: user2._id })

      if (!user1ReferredBy) {
        if (!user1.referredBy) {


          if (new Date(user1.createdAt) < new Date(user2.createdAt)) {
            //update user2 to isDeleted to true
          }
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }

};
// findDuplicateWalletAddresses();


const convertWalletAddressCase = async () => {
  const bulkWrite = []

  const users = await WalletUser.find({
    walletAddress: { $regex: /[A-Z]/ }
  }).select('walletAddress')

  console.log(users.length);


  for (const user of users) {
    bulkWrite.push({
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: {
            walletAddress: user.walletAddress.toLowerCase().trim()
          },
        },
      }
    })
  }
  await WalletUserV2.bulkWrite(bulkWrite)
}

// convertWalletAddressCase()
