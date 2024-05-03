import axios from "axios";
import { AnyBulkWriteOperation } from "mongodb";

import { _generateReferralCode } from "../controller/user";
import { WalletUser, IWalletUser } from "../database/models/walletUsers";

export const addUsers = async () => {
  console.log("Starting add new users process...");
  const baseUrl =
    "https://api.goldsky.com/api/public/project_clsk1wzatdsls01wchl2e4n0y/subgraphs/";
  const apiManta = baseUrl + "zerolend-manta/1.0.0/gn";
  const apiZKSync = baseUrl + "zerolend-zksync/1.0.0/gn";
  const apiEth = baseUrl + "zerolend-mainnet-lrt/1.0.0/gn";
  const apiLinea = baseUrl + "zerolend-linea/1.0.0/gn";
  const apiBlast = baseUrl + "zerolend-blast/1.0.0/gn";
  const apiXLayer = baseUrl + "zerolend-xlayer/1.0.0/gn";

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

  // X layer
  try {
    console.log("adding x layer wallet users");
    await addSupplyBorrowUsers(apiXLayer);
  } catch (e) {
    console.log("adding X Layer users failed with error:", e);
  }

  console.log("add new users process completed.");
};

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

export const addSupplyBorrowUsersManta = async (queryURL: string) => {
  const first = 1000;
  let skip = 0;
  let batch;
  const addressesToInsert = [];
  do {
    const graphQuery = `query {
      users(
        where: {lastUpdateTimestamp_gte: 1710282994, id_gt: "0x0000000000000000000000000000000000000000"},
        skip: ${skip}
      ) {
        id
        lastUpdateTimestamp
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
      users(
        where: {lastUpdateTimestamp_gte: 1710282994, id_gt: "${lastAddress}"},
        first: 1000
      ) {
        id
        lastUpdateTimestamp
      }
    }`;

    const headers = {
      "Content-Type": "application/json",
    };
    batch = await axios.post(queryURL, { query: graphQuery }, { headers });
    if (batch.data.data.users.length === 0) {
      console.log("No users to add");
      return;
    }
    const addresses = batch.data.data.users.map((user: any) => user.id);
    const existingAddresses = (
      await WalletUser.find(
        {
          walletAddress: {
            $in: addresses.map((address: string) =>
              address.toLowerCase().trim()
            ),
          },
          isDeleted: false,
        },
        { walletAddress: 1 }
      )
    ).map((user) => user.walletAddress.toLowerCase());

    const newAddresses = addresses.filter(
      (address: string) => !existingAddresses.includes(address.toLowerCase())
    );
    addressesToInsert.push(...newAddresses);
    lastAddress = batch.data.data.users[batch.data.data.users.length - 1].id;
    console.log(addressesToInsert.length, "addresses to insert");
  } while (batch.data.data.users.length === first);

  await executeAddSupplyBorrowUsers(addressesToInsert);
};
