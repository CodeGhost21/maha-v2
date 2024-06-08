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
          walletAddress: { $ne: " " }
        },
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
      }
    ], { allowDiskUse: true });
    console.log("Duplicate wallet addresses:", duplicates, duplicates.length);
    for (const user of duplicates) {
      const fetchUsers = await WalletUser.find({ walletAddress: user._id });

      const user0: any = fetchUsers[0];
      const user1: any = fetchUsers[1];

      const referredByUser0 = await WalletUser.findOne({
        referredBy: user0._id,
      });
      const referredByUser1 = await WalletUser.findOne({
        referredBy: user1._id,
      });

      if (user0.referredBy && user1.referredBy) {
        if ((new Date(user0.createdAt) > new Date(user1.createdAt)) && user0.referredBy === user1.referredBy) {
          console.log(72);
          fetchUsers[1].isDeleted = true;
          await fetchUsers[1].save();
        }
        continue;
      } else if (referredByUser0 && referredByUser1) {
        continue;
      } else if (user0.referredBy) {
        fetchUsers[1].isDeleted = true;
        await fetchUsers[1].save();
      } else if (user1.referredBy) {
        fetchUsers[0].isDeleted = true;
        await fetchUsers[0].save();
      } else if (referredByUser0) {
        fetchUsers[1].isDeleted = true;
        await fetchUsers[1].save();
      } else if (referredByUser1) {
        fetchUsers[0].isDeleted = true;
        await fetchUsers[0].save();
      } else if (new Date(user0.createdAt) > new Date(user1.createdAt)) {
        fetchUsers[1].isDeleted = true;
        await fetchUsers[1].save();
      } else {
        fetchUsers[0].isDeleted = true;
        await fetchUsers[0].save();
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
findDuplicateWalletAddresses();

const convertWalletAddressCase = async () => {
  const bulkWrite = [];

  const users = await WalletUser.find({
    walletAddress: { $regex: /[A-Z]/ },
  }).select("walletAddress");

  console.log(users.length);

  for (const user of users) {
    bulkWrite.push({
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: {
            walletAddress: user.walletAddress.toLowerCase().trim(),
          },
        },
      },
    });
  }
  await WalletUserV2.bulkWrite(bulkWrite);
};

// convertWalletAddressCase()
