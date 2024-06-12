import axios from "axios";
import { AnyBulkWriteOperation } from "mongodb";

import { _generateReferralCode } from "../controller/user";
import { WalletUserV2 } from "../database/models/walletUsersV2";
import { IWalletUser } from "../database/interface/walletUser/walletUser";
import {
  apiBlast,
  apiEth,
  apiLinea,
  apiManta,
  apiStakeZero,
  apiXLayer,
  apiZKSync,
} from "../controller/quests/constants";

export const addUsers = async () => {
  console.log("Starting add new users process...");

  //manta
  try {
    console.log("adding manta wallet users");
    await addSupplyBorrowUsersManta(apiManta);
  } catch (e) {
    console.log("adding manta users failed with error:", e);
  }

  //zksync
  try {
    console.log("adding zksync wallet users");
    await addSupplyBorrowUsers(apiZKSync);
  } catch (e) {
    console.log("adding zksync users failed with error:", e);
  }

  //ETH Mainnet LRTs
  try {
    console.log("adding ethereum wallet users");
    await addSupplyBorrowUsers(apiEth);
  } catch (e) {
    console.log("adding ETH Mainnet LRTs users failed with error:", e);
  }

  //linea
  try {
    console.log("adding linea wallet users");
    await addSupplyBorrowUsers(apiLinea);
  } catch (e) {
    console.log("adding ETH Mainnet LRTs users failed with error:", e);
  }

  //Blast
  try {
    console.log("adding blast wallet users");
    await addSupplyBorrowUsers(apiBlast);
  } catch (e) {
    console.log("adding Blast users failed with error:", e);
  }

  // // X layer
  try {
    console.log("adding x layer wallet users");
    await addSupplyBorrowUsers(apiXLayer);
  } catch (e) {
    console.log("adding X Layer users failed with error:", e);
  }

  //linea stake
  try {
    console.log("adding linea wallet users (stakers)");
    await addSupplyBorrowUsers(apiStakeZero);
  } catch (e) {
    console.log("adding ETH Mainnet LRTs users failed with error:", e);
  }
  console.log("add new users process completed.");
};

export const executeAddSupplyBorrowUsers = async (
  addressesToInsert: string[]
) => {
  // const batchSize = 1000;
  console.log("addresses to insert", addressesToInsert.length);
  let rank = await WalletUserV2.count();
  // for (let i = 0; i < addressesToInsert.length; i = i + batchSize) {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  console.log("initial user bulk write", userBulkWrites.length);
  // const batchAddresses = addressesToInsert.slice(i, i + batchSize);
  addressesToInsert.forEach((address) => {
    rank = rank + 1;
    const referralCode = _generateReferralCode();
    const user = new WalletUserV2({
      walletAddress: address.toLowerCase().trim(),
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
      console.log("writing ", userBulkWrites.length, "entries to db");
      await WalletUserV2.bulkWrite(userBulkWrites);
      // const remaining = addressesToInsert.length - (i + batchSize);
      console.log("Bulk write operations executed successfully.");
    } catch (error) {
      console.error("Error executing bulk write operations:", error);
    }
  } else {
    console.log("No new users to insert.");
  }
  // }
};

export const addSupplyBorrowUsersManta = async (queryURL: string) => {
  const first = 1000;
  let skip = 0;
  let batch;
  do {
    const addressesToInsert = [];
    const graphQuery = `query {
    users(first: ${first}, skip: ${skip}) {
        id
      }
    }`;
    const headers = {
      "Content-Type": "application/json",
    };
    batch = await axios.post(
      queryURL,
      { query: graphQuery },
      { headers, timeout: 30000 }
    );
    const addresses = batch.data.data.users.map((user: any) => user.id);
    console.log("addresses", addresses);
    const existingUsers = await WalletUserV2.find({
      walletAddress: {
        $in: addresses.map((address: string) => address.toLowerCase().trim()),
      },
    }).select("walletAddress");
    const existingAddresses = existingUsers.map((user) => user.walletAddress);
    const newAddresses = addresses.filter(
      (address: string) => !existingAddresses.includes(address)
    );
    addressesToInsert.push(...newAddresses);
    skip += first;
    console.log(addressesToInsert.length, "addresses to insert");
    await executeAddSupplyBorrowUsers(addressesToInsert);
  } while (batch.data.data.users.length === first);
  console.log("add users operations executed successfully.");
};

export const addSupplyBorrowUsers = async (queryURL: string) => {
  const first = 1000;
  let users;
  let lastAddress = "0x0000000000000000000000000000000000000000";
  do {
    const addressesToInsert = [];
    // const queryURL =
    //   "https://api.studio.thegraph.com/query/49970/zerolend/version/latest";

    let graphQuery = `query {
      users(
        where: {lastUpdateTimestamp_gte: 1710282994, id_gt: "${lastAddress}"},
        first: 1000
      ) {
        id
        lastUpdateTimestamp
      }
    }`;

    if (queryURL.includes("zerolend-omnistaking")) {
      graphQuery = `query {
        tokenBalances(first: 1000, where: {id_gt: "${lastAddress}"}) {
          id

        }
      }`;
    }

    const headers = {
      "Content-Type": "application/json",
    };
    const batch = await axios.post(
      queryURL,
      { query: graphQuery },
      { headers, timeout: 30000 }
    );

    users = queryURL.includes("zerolend-omnistaking")
      ? batch.data.data.tokenBalances
      : batch.data.data.users;

    if (users.length === 0) {
      console.log("No users to add");
      return;
    }

    const addresses = users.map((user: any) => user.id);
    const existingAddresses = (
      await WalletUserV2.find(
        {
          walletAddress: {
            $in: addresses.map((address: string) =>
              address.toLowerCase().trim()
            ),
          },
        },
        { walletAddress: 1 }
      )
    ).map((user) => user.walletAddress.toLowerCase());

    const newAddresses = addresses.filter(
      (address: string) => !existingAddresses.includes(address.toLowerCase())
    );
    addressesToInsert.push(...newAddresses);
    lastAddress = users[users.length - 1].id;
    console.log(addressesToInsert.length, "addresses to insert");
    await executeAddSupplyBorrowUsers(addressesToInsert);
  } while (users.length === first);
  console.log("Bulk write operations executed successfully.");
};
