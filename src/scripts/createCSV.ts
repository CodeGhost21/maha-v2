import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";
import fs from "fs";

dotenv.config();
nconf
  .argv()
  .env()
  .file({ file: path.resolve("./config.json") });

import { open } from "../database";
open();

import { AbstractProvider } from "ethers";
import { Snapshot } from "../database/models/snapshot";
import { SnapshotV1 } from "../database/models/snapshotv1";

import cache from "../utils/cache";
import axios from "axios";
import { IPriceList, Multiplier, assetDenomination } from "../controller/quests/constants";
import { getPriceCoinGecko } from "../controller/quests/onChainPoints";
import { IAsset } from "../database/interface/walletUser/assets";
import { IWalletUserModel } from "../database/models/walletUsersV2";
import {
  blastProvider,
  ethLrtProvider,
  lineaProvider,
  mantaProvider,
  xLayerProvider,
  zksyncProvider,
} from "../utils/providers";
import {
  apiManta,
  apiZKSync,
  apiEth,
  apiLinea,
  apiBlast,
  apiXLayer,
} from "../controller/quests/constants";

export const saveOnchainData = async (
  api: string,
  chain: string,
  p: AbstractProvider
) => {
  const timestamp = Date.now();
  console.log("start time ----", timestamp);

  const batchSize = 1000;
  let skip = 5000;
  let batch;
  const currentBlock = await p.getBlockNumber();
  do {
    const bulkWrite = [];
    batch = await SnapshotV1.find().skip(skip).limit(batchSize);
    const addresses = batch.map((user) => user.walletAddress);
    const result = await supplyBorrowPointsGQL(api, addresses, p, currentBlock);

    for (const [key, value] of result.supply) {
      let totalSupplyAmount = 0;
      const Keys = Object.keys(value);
      if (Keys.length) {
        Keys.forEach((key) => {
          totalSupplyAmount += value[key];
        });
      }
      if (totalSupplyAmount)
        bulkWrite.push({
          updateOne: {
            filter: { walletAddress: key },
            update: {
              $inc: {
                totalSupply: totalSupplyAmount,
              },
              $set: {
                [`supply${chain}`]: totalSupplyAmount,
              },
            },
          },
        });
    }

    for (const [key, value] of result.borrow) {
      let totalBorrowAmount = 0;
      const Keys = Object.keys(value);
      if (Keys.length) {
        Keys.forEach((key) => {
          totalBorrowAmount += value[key];
        });
      }
      if (totalBorrowAmount)
        bulkWrite.push({
          updateOne: {
            filter: { walletAddress: key },
            update: {
              $inc: {
                totalBorrow: totalBorrowAmount,
              },
              $set: {
                [`borrow${chain}`]: totalBorrowAmount,
              },
            },
          },
        });
    }

    skip += batchSize;
    await SnapshotV1.bulkWrite(bulkWrite);
  } while (batch.length === batchSize);
  console.log("......done");
  console.log("Total Time ----", Date.now() - timestamp);
};

try {
  // saveOnchainData(apiManta, "Manta", mantaProvider);
  // saveOnchainData(apiZKSync, "Zksync", zksyncProvider);
  // saveOnchainData(apiLinea, "Linea", lineaProvider);
  // saveOnchainData(apiEth, "Ethereum", ethLrtProvider);
  // saveOnchainData(apiXLayer, "XLayer", xLayerProvider);
  // saveOnchainData(apiBlast, "Blast", blastProvider);
} catch (e) {
  console.log(e);
}

export const supplyBorrowPointsGQL = async (
  api: string,
  addresses: string[],
  p: AbstractProvider,
  currentBlock: number
) => {
  try {
    let marketPrice: IPriceList = await cache.get("coingecko:PriceList") as IPriceList;
    if (!marketPrice) {
      marketPrice = await getPriceCoinGecko();
    }

    const graphQuery = `query {
      userReserves(
        block: {number: ${currentBlock - 5}},
        where: {
          and: [
            {
              or: [
                { currentTotalDebt_gt: 0 },
                { currentATokenBalance_gt: 0 }
              ]
            },
            {user_in: [${addresses.map(
      (address) => `"${address.toLowerCase()}"`
    )}]},
          ]
        }
      ) {
        user {
          id
        }
        currentTotalDebt
        currentATokenBalance
        reserve {
          underlyingAsset
          symbol
          name
        }
      }
    }`;
    // {user_in: [${addresses.map(
    //   (address) => `"${address.toLowerCase()}"`
    // )}]},
    const headers = {
      "Content-Type": "application/json",
    };
    const data = await axios.post(api, { query: graphQuery }, { headers });
    const result = data.data.data.userReserves;

    const borrow = new Map();
    const supply = new Map();

    result.map((userReserve: any) => {
      const asset = userReserve.reserve.symbol.toLowerCase() as keyof IAsset;
      const supplyData = supply.get(userReserve.user.id) || {};
      supplyData[asset] =
        (Number(userReserve.currentATokenBalance) /
          assetDenomination[`${asset}`]) *
        Number(marketPrice[`${asset}`]);
      supply.set(userReserve.user.id, supplyData);

      const borrowData = borrow.get(userReserve.user.id) || {};
      borrowData[asset] =
        (Number(userReserve.currentTotalDebt) / assetDenomination[`${asset}`]) *
        Number(marketPrice[`${asset}`]);
      borrow.set(userReserve.user.id, borrowData);
    });

    return {
      supply,
      borrow,
    };
  } catch (error) {
    console.log("error while fetching points");
    throw error;
  }
};

export const resetData = async () => {
  const batchSize = 1000;
  let skip = 0;
  let batch;
  const bulkWrite = [];
  do {
    console.log(skip);
    batch = await SnapshotV1.find()
      .skip(skip)
      .limit(batchSize)
      .select("walletAddress");
    for (const user of batch) {
      bulkWrite.push({
        updateOne: {
          filter: { walletAddress: user.walletAddress },
          update: {
            $set: {
              supplyManta: 0,
              supplyLinea: 0,
              supplyEthereum: 0,
              supplyZksync: 0,
              totalSupply: 0,
              borrowZksync: 0,
              borrowManta: 0,
              borrowLinea: 0,
              borrowXLayer: 0,
              borrowEthereum: 0,
              borrowBlast: 0,
              totalBorrow: 0,
            },
          },
        },
      });
    }
    skip += batchSize;
  } while (batch.length === batchSize);
  await SnapshotV1.bulkWrite(bulkWrite);
  console.log("......done");
};

// resetData();

const writeData = async () => {
  const batchSize = 1000;
  let skip = 0;
  let batch;
  do {
    console.log(skip);
    batch = await SnapshotV1.find({}).skip(skip).limit(batchSize);

    writeCsvFile(batch);
    skip += batchSize;
  } while (batch.length === batchSize);
};

const fileName = "./usersData.csv";
export const writeCsvFile = (data: any) => {
  // Create a header for the CSV if the file doesn't exist yet
  if (!fs.existsSync(fileName)) {
    fs.writeFileSync(
      fileName,
      "Address,Total Supply,Total Borrow,ZksyncSupply,ZksyncBorrow,LineaSupply,LineaBorrow,EthereumSupply,EthereumBorrow,MantaSupply,MantaBorrow,BlastSupply,BlastBorrow,XLayerSupply,XLayerBorrow\n",
      {
        encoding: "utf-8",
      }
    );
  }

  // Create a lock file
  const lockFile = `${fileName}.lock`;

  // Acquire a lock
  if (fs.existsSync(lockFile)) {
    console.log("File is being updated by another process. Skipping.");
    return;
  }

  fs.writeFileSync(lockFile, "", { encoding: "utf-8" });

  try {
    // Append each data entry to the CSV content
    data.forEach((entry: any) => {
      const csvRow = `${entry.walletAddress},${entry.totalSupply},${entry.totalBorrow},${entry.supplyZksync},${entry.borrowZksync},${entry.supplyLinea},${entry.borrowLinea},${entry.supplyEthereum},${entry.borrowEthereum},${entry.supplyManta},${entry.borrowManta},${entry.supplyBlast},${entry.borrowBlast},${entry.supplyXLayer},${entry.borrowXLayer}\n`;
      fs.appendFileSync(fileName, csvRow, { encoding: "utf-8" });
    });

    console.log(`Data appended to CSV file "${fileName}" successfully.`);
  } catch (err) {
    console.error("Error appending to CSV file:", err);
  } finally {
    // Release the lock
    fs.unlinkSync(lockFile);
  }
};
// writeData();

// const saveData = async () => {
//   const bulkwrite = [];
//   for (const item of data) {
//     bulkwrite.push({
//       insertOne: {
//         document: {
//           walletAddress: item.address,
//         },
//       },
//     });
//   }

//   await SnapshotV1.bulkWrite(bulkwrite);
//   console.log("data added");
// };
// saveData();
