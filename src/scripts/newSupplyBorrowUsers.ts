import axios from "axios";
import { AnyBulkWriteOperation } from "mongodb";

import { _generateReferralCode } from "../controller/user";
import { WalletUser, IWalletUser } from "../database/models/walletUsers";

export const executeAddSupplyBorrowUsers = async (
  addressesToInsert: string[]
) => {
  const usersCount = await WalletUser.count();
  let rank = usersCount;
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  addressesToInsert.forEach((address) => {
    rank = rank + 1;
    const referralCode = _generateReferralCode();
    const user = new WalletUser({
      walletAddress: address.toLowerCase().trim(),
      referralCode,
      rank: rank,
      isDeleted: false,
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

export const addSupplyBorrowUsersManta = async () => {
  const first = 1000;
  let skip = 0;
  let batch;
  const addressesToInsert = [];
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
      walletAddress: {
        $in: addresses.map(
          (address: string) => address.toLowerCase().trim() //new RegExp("^" + address + "$", "i")
        ),
      },
      isDeleted: false,
    });
    const existingAddresses = existingUsers.map((user) => user.walletAddress);
    const newAddresses = addresses.filter(
      (address: string) => !existingAddresses.includes(address)
    );
    addressesToInsert.push(...newAddresses);
    skip += first;
    console.log(addressesToInsert.length, "addresses to insert");
  } while (batch.data.data.users.length === first);
  await executeAddSupplyBorrowUsers(addressesToInsert);
};

export const addSupplyBorrowUsers = async (queryURL: string) => {
  const first = 1000;
  let batch;
  let lastAddress = "0x0000000000000000000000000000000000000000";
  const addressesToInsert = [];
  do {
    // const queryURL =
    //   "https://api.studio.thegraph.com/query/49970/zerolend/version/latest";

    const graphQuery = `query {
      users(where: {id_gt: "${lastAddress}"}, first: 1000) {
        id
      }
    }`;

    const headers = {
      "Content-Type": "application/json",
    };
    batch = await axios.post(queryURL, { query: graphQuery }, { headers });
    const addresses = batch.data.data.users.map((user: any) => user.id);
    const existingUsers = await WalletUser.find({
      walletAddress: {
        $in: addresses.map(
          (address: string) => address.toLowerCase().trim() //new RegExp("^" + address + "$", "i")
        ),
      },
      isDeleted: false,
    });
    const existingAddresses = existingUsers.map((user) => user.walletAddress);
    const newAddresses = addresses.filter(
      (address: string) => !existingAddresses.includes(address)
    );
    addressesToInsert.push(...newAddresses);
    lastAddress = batch.data.data.users[batch.data.data.users.length - 1].id;
    console.log(addressesToInsert.length, "addresses to insert");
  } while (batch.data.data.users.length === first);

  await executeAddSupplyBorrowUsers(addressesToInsert);
};
