import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";

dotenv.config();
nconf
  .argv()
  .env()
  .file({ file: path.resolve("./config.json") });

import { ethers } from "ethers";
import { AnyBulkWriteOperation } from "mongodb";
import { IWalletUser, WalletUser } from "../database/models/walletUsers";
import MyTokenABI from "../abis/MyToken.json";
import { sepoliaProvider } from "../utils/providers";
import { open } from "../database";
open();

const privateKey = nconf.get("PRIVATE_KEY");

const assignClaimPoints = async () => {
  const batchSize = 100;
  let skip = 0;
  let batch;
  const wallet = new ethers.Wallet(privateKey, sepoliaProvider);
  const contract = new ethers.Contract(
    nconf.get("MYTOKEN"),
    MyTokenABI,
    wallet
  );
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  do {
    batch = await WalletUser.find({
      walletAddress: { $exists: true, $ne: null, $not: { $eq: "" } },
    })
      .skip(skip)
      .limit(batchSize);
    console.log("user count", batch.length);

    const addresses: any = [];
    const amounts: any = [];
    batch.forEach((user) => {
      const amount = user.totalPointsV2 - user.claimedTotalPointsV2;
      if (amount > 0) {
        addresses.push(user.walletAddress);
        const parsedAmount = ethers.parseUnits(String(amount), 18);
        amounts.push(parsedAmount);
        userBulkWrites.push({
          updateOne: {
            filter: { _id: user.id },
            update: {
              $inc: {
                claimedTotalPointsV2: amount,
              },
            },
          },
        });
      }
    });

    //call mint function
    if (addresses.length > 0) {
      const response = await contract.mint(addresses, amounts);
      console.log(response);
    }
    await WalletUser.bulkWrite(userBulkWrites);
    skip += batchSize;
  } while (batch.length === batchSize);
  console.log("done");
};

// assignClaimPoints()
