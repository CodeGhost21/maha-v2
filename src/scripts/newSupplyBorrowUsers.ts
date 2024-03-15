import axios from "axios";
import { AnyBulkWriteOperation } from "mongodb";

import { _generateReferralCode } from "../controller/user";
import { WalletUser, IWalletUser } from "../database/models/walletUsers";

export const addSupplyBorrowUsers = async () => {
  const first = 1000;
  let skip = 0;
  let batch;
  const usersCount = await WalletUser.count();
  let rank = usersCount;
  const addressesToInsert = [];

  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  do {
    const queryURL =
      "https://api.goldsky.com/api/public/project_clsk1wzatdsls01wchl2e4n0y/subgraphs/zerolend-m/1.0.0/gn";

    const graphQuery = `query {
      users(first: ${first}, skip: ${skip}) {
        id
      }
    }`;
    const headers = {
      "Content-Type": "application/json",
    };
    batch = await axios.post(queryURL, { query: graphQuery }, { headers });
    const addresses = batch.data.data.users.map((user: any) => user.id);
    const existingUsers = await WalletUser.find({
      walletAddress: { $in: addresses },
    });
    const existingAddresses = existingUsers.map((user) => user.walletAddress);
    const newAddresses = addresses.filter(
      (address: string) => !existingAddresses.includes(address)
    );
    addressesToInsert.push(...newAddresses);
    skip += first;
  } while (batch.data.data.users.length === first);

  addressesToInsert.forEach((address) => {
    rank = rank + 1;
    const referralCode = _generateReferralCode();
    const user = new WalletUser({
      walletAddress: address,
      referralCode,
      rank: rank,
    });
    userBulkWrites.push({
      insertOne: {
        document: user,
      },
    });
  });

  if (userBulkWrites.length > 0) {
    try {
      // Execute bulk write operations
      await WalletUser.bulkWrite(userBulkWrites);
      console.log("Bulk write operations executed successfully.");
    } catch (error) {
      console.error("Error executing bulk write operations:", error);
    }
  } else {
    console.log("No new users to insert.");
  }
};
