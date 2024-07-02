// import axios from "axios";
// import { BlastUser, IBlastUserModel } from "../../database/models/blastUsers";
// import { BlastBatches } from "../../database/models/blastBatches";

// import { getBlastChallenge, getBearerToken, BlastData } from "./blast";
// import axiosRetry from "axios-retry";
// import { AnyBulkWriteOperation } from "mongodb";
// import { writeFileSync, appendFileSync } from "fs";
// import { WalletUserV2 } from "src/database/models/walletUsersV2";
// import { apiBlast, assetDenomination } from "./constants";
// import { IAsset } from "src/database/interface/walletUser/assets";
// import { getPriceCoinGecko } from "./onChainPoints";
// import cache from "src/utils/cache";

// // Exponential back-off retry delay between requests
// axiosRetry(axios, {
//   // retries: 3, // default is 3
//   retryDelay: (retryCount) => {
//     console.log(`next retry in: ${retryCount * 5} seconds`);
//     return retryCount * 5000; // time interval between retries
//   },
//   onRetry: (retryCount) => {
//     console.log("retrying count: ", retryCount);
//   },
//   retryCondition: (error) => {
//     // if retry condition is not specified, by default idempotent requests are retried
//     return (
//       error.response?.status === 429 ||
//       error.response?.status === 520 ||
//       error.response?.status === 408 ||
//       error.response?.status === 502 ||
//       error.response?.status === 503 ||
//       error.response?.status === 504 ||
//       error.message.toLowerCase().includes("store error")
//     );
//   },
// });

// const baseUrl = "https://waitlist-api.prod.blast.io";

// type PointType = "LIQUIDITY" | "DEVELOPER";

// type Transfer = {
//   toAddress: string;
//   points: string;
// };

// type Request = {
//   pointType: PointType;
//   transfers: Transfer[];
//   secondsToFinalize?: number | null;
// };

// const blastGoldAddress = "0xc2764d3ffbb6fbc3e1b1b5a6cc8369205a0a90dd";

// export const assignBlastPoints = async (actualPoints: Map<any, any>) => {
//   const bulkOperations: any = [];
//   const addressUSDB = "0x23A58cbe25E36e26639bdD969B0531d3aD5F9c34";
//   const addressWETH = "0x53a3Aa617afE3C12550a93BA6262430010037B04";

//   const challengeUSDB = await getBlastChallenge(addressUSDB);
//   const challengeWETH = await getBlastChallenge(addressWETH);

//   const tokenUSDB = await getBearerToken(challengeUSDB);
//   const tokenWETH = await getBearerToken(challengeWETH);

//   const batchId = Math.floor(Date.now());

//   const transferBatchUSDB = [];
//   const transferBatchWETH = [];

//   for (const [walletAddress, actual] of actualPoints) {
//     const actualUSDB = actual["blastPoints.pointsPendingUSDB"] ?? 0;
//     const actualWETH = actual["blastPoints.pointsPendingWETH"] ?? 0;

//     if (actualUSDB) {
//       const transferUSDB: Transfer = {
//         toAddress: walletAddress,
//         points: (actualUSDB as number).toFixed(2),
//       };
//       transferBatchUSDB.push(transferUSDB);
//     }

//     if (actualWETH) {
//       const transferWETH: Transfer = {
//         toAddress: walletAddress,
//         points: (actualWETH as number).toFixed(2),
//       };
//       transferBatchWETH.push(transferWETH);
//     }

//     // reset points pending
//     bulkOperations.push({
//       updateOne: {
//         filter: { walletAddress },
//         update: {
//           $set: {
//             "blastPoints.pointsPendingUSDB": 0,
//             "blastPoints.pointsPendingWETH": 0,
//             "blastPoints.pointsPending": 0,
//           },
//           $inc: {
//             "blastPoints.pointsGivenUSDB": actualUSDB ?? 0,
//             "blastPoints.pointsGivenWETH": actualWETH ?? 0,
//             "blastPoints.pointsGiven": actualWETH ?? 0 + actualUSDB ?? 0,
//           },
//         },
//       },
//     });
//   }

//   const requestUSDB: Request = {
//     pointType: "LIQUIDITY",
//     transfers: transferBatchUSDB,
//     secondsToFinalize: 3600,
//   };

//   const requestWETH: Request = {
//     pointType: "LIQUIDITY",
//     transfers: transferBatchWETH,
//     secondsToFinalize: 3600,
//   };

//   const urlUSDB = `${baseUrl}/v1/contracts/${addressUSDB}/batches/${batchId}_usdb`;
//   const urlWETH = `${baseUrl}/v1/contracts/${addressWETH}/batches/${batchId}_weth`;

//   const headersUSDB = {
//     Authorization: `Bearer ${tokenUSDB}`,
//   };
//   const headersWETH = {
//     Authorization: `Bearer ${tokenWETH}`,
//   };

//   // send request for USDB
//   try {
//     await BlastUser.bulkWrite(bulkOperations);

//     const responseUSDB = await axios.put(urlUSDB, requestUSDB, {
//       headers: headersUSDB,
//     });

//     if (responseUSDB.data.success) {
//       console.log("USDB transfer successful, saving batch");

//       //saving batch
//       await BlastBatches.create({
//         batchId: `${batchId}_usdb`,
//         batch: transferBatchUSDB,
//       });
//     }

//     const responseWETH = await axios.put(urlWETH, requestWETH, {
//       headers: headersWETH,
//     });

//     if (responseWETH.data.success) {
//       console.log("WETH transfer successful, saving batch");

//       //saving batch
//       await BlastBatches.create({
//         batchId: `${batchId}_weth`,
//         batch: transferBatchWETH,
//       });
//     }

//     return true;
//   } catch (e: any) {
//     console.error("ERROR:", e);
//     return false;
//   }
// };
// // usdb eth - blast
// const getPoints = async (userBatch: any, blastGoldWethTotal: number) => {
//   console.log("analyzing users");
//   const url =
//     "https://api.goldsky.com/api/public/project_clsk1wzatdsls01wchl2e4n0y/subgraphs/zerolend-blast-points/1.0.0/gn";

//   const query = `{
//     usdbusers(where: {id_in: [${userBatch.map((u: any) => `"${u.id}"`)}]}) {
//       id
//       balance
//       debt
//       lastUpdatedAt 
//       accumulatedPoints
//     }
//     wethusers(where: {id_in: [${userBatch.map((u: any) => `"${u.id}"`)}]}) {
//       id
//       balance
//       debt
//       lastUpdatedAt
//       accumulatedPoints
//     }
//     core(id:"1") {
//       id
//       totalPointsUSDB
//       totalPointsWETH
//     }
//   }`;

//   const data = await axios.post(url, {
//     query,
//   });

//   data.data.errors ? console.log(data.data.errors) : "";

//   const results = data.data.data;

//   const usdbusers = results.usdbusers;
//   const wethusers = results.wethusers;

//   const core = results.core;
//   const pointsEarnedMap = new Map();

//   const percentage = 100000000;

//   // subtract from points given
//   // also sub from previous give from db
//   usdbusers.forEach((user: any) => {
//     const currentPointsAccumulated =
//       BigInt(user.balance) -
//       BigInt(user.debt) * BigInt(Date.now() - user.lastUpdatedAt);

//     const usdbPointsEarnedPercentage = Number(
//       ((BigInt(user.accumulatedPoints) + currentPointsAccumulated) *
//         BigInt(percentage)) /
//         BigInt(core.totalPointsUSDB)
//     );

//     // calculate share for user if accumulated points are +ve
//     if (usdbPointsEarnedPercentage > 0) {
//       const usdbPointsEarned =
//         Number(usdbPointsEarnedPercentage * usdbPointsTotal) / percentage;

//       pointsEarnedMap.set(user.id, { usdbPointsEarned });
//     }
//   });

//   wethusers.forEach((user: any) => {
//     const currentPointsAccumulated =
//       BigInt(user.balance) -
//       BigInt(user.debt) * BigInt(Date.now() - user.lastUpdatedAt);

//     const wethPointsEarnedPercentage = Number(
//       ((BigInt(user.accumulatedPoints) + currentPointsAccumulated) *
//         BigInt(percentage)) /
//         BigInt(core.totalPointsUSDB)
//     );

//     // calculate share for user if accumulated points are +ve
//     if (wethPointsEarnedPercentage > 0) {
//       const wethPointsEarned =
//         Number(wethPointsEarnedPercentage * wethPointsTotal) / percentage;
//       const usdbPointsEarned = pointsEarnedMap.get(user.id);
//       pointsEarnedMap.set(user.id, { ...usdbPointsEarned, wethPointsEarned });
//     }
//   });

//   return pointsEarnedMap;
// };

// const calculateAndUpdatePositivePointsInDb = async (
//   usersShare: Map<any, any>,
//   users: IBlastUserModel[]
// ) => {
//   // const correctedDateString = "2024-06-21T13:25:06.631+0000".replace(
//   //   "+0000",
//   //   "Z"
//   // );

//   // Convert the string to a JavaScript Date object
//   // const date = new Date(correctedDateString);
//   // console.log(date);
//   // fetch stored users from batch ids
//   const storedBatch = await BlastUser.find({
//     $and: [
//       {
//         walletAddress: { $in: users.map((u: any) => u.id) },
//       },
//       // { updatedAt: { $lt: date } },
//     ],
//   }).select("walletAddress blastPoints");

//   // use map to return points, this will eliminate fetch operation while assigning points
//   const actualPoints = new Map();
//   const bulkOperations: any = [];

//   console.log("updating points earned...");
//   for (const [walletAddress, share] of usersShare) {
//     //updated db with current points earned
//     const _pointsUSDB = Number(share.usdbPointsEarned ?? 0);
//     const _pointsWETH = Number(share.wethPointsEarned ?? 0);

//     const user = storedBatch.find(
//       (user) => user.walletAddress === walletAddress
//     );

//     let pointsToGiveUSDB = 0;
//     let pointsToGiveWETH = 0;

//     // if accumulated points are +ve, get points to give (points accumulated that we fetch are cumulative)
//     // @dev this checks can be removed as no negative points will always be +ve here because of the checks in getUSDBWETHPoints
//     if (_pointsUSDB > 0) {
//       // subtract points given and add points pending
//       pointsToGiveUSDB =
//         _pointsUSDB -
//         (user
//           ? (user.blastPoints.pointsGivenUSDB ?? 0) -
//             (user.blastPoints.pointsPendingUSDB ?? 0)
//           : 0);
//     }

//     if (_pointsWETH > 0) {
//       // subtract points given and add points pending
//       pointsToGiveWETH =
//         _pointsWETH -
//         (user
//           ? (user.blastPoints.pointsGivenWETH ?? 0) -
//             (user.blastPoints.pointsPendingWETH ?? 0)
//           : 0);
//     }

//     // object to set values in db,
//     const valuesToSet: any = {};

//     // if USDB points to give are +ve, update db
//     if (pointsToGiveUSDB > 0) {
//       valuesToSet["blastPoints.pointsPendingUSDB"] = pointsToGiveUSDB;
//       valuesToSet["blastPoints.pointsPending"] = pointsToGiveUSDB;
//     }

//     // if WETH points to give are +ve, update db
//     if (pointsToGiveWETH > 0) {
//       valuesToSet["blastPoints.pointsPendingWETH"] = pointsToGiveWETH;
//       if (!valuesToSet["blastPoints.pointsPending"]) {
//         valuesToSet["blastPoints.pointsPending"] = pointsToGiveWETH;
//       } else {
//         valuesToSet["blastPoints.pointsPending"] += pointsToGiveWETH;
//       }
//     }

//     if (Object.keys(valuesToSet).length > 0) {
//       // set timeStamp
//       valuesToSet["blastPoints.timestamp"] = Date.now();

//       actualPoints.set(walletAddress, valuesToSet);

//       // push update/insert op in bulk ops
//       bulkOperations.push({
//         updateOne: {
//           filter: { walletAddress },
//           update: {
//             $set: valuesToSet,
//           },
//           upsert: true, // creates new user if walletAddress is not found
//         },
//       });
//     }
//   }

//   if (bulkOperations.length > 0) {
//     await BlastUser.bulkWrite(bulkOperations);
//     console.log(
//       `Inserted/Updated ${bulkOperations.length} documents into BlastUser collection.`
//     );
//     // create CSV
//   }
//   return actualPoints;
// };

// export const distributeBlastGold = async () => {
//   const blastData = await BlastData();
//   let marketPrice: any = await cache.get("coingecko:PriceList");
//   if (!marketPrice) {
//     marketPrice = await getPriceCoinGecko();
//   }
//   /*  DEVELOPER: {
//       available: '1142.99',
//       pendingSent: '0',
//       earnedCumulative: '26746',
//       receivedCumulative: '0',
//       finalizedSentCumulative: '25603.01'
//     }, */
//   const blastGoldWETH: number = blastData.blastGoldWETH;

//   console.log("blast gold earned", blastGoldWETH);

//   const first = 1000;
//   let skip = 0;
//   let batch;
//   let lastAddress = "0x0000000000000000000000000000000000000000";
//   const allBorrowersBlast = new Map();
//   let totalBorrowedUSDB
//   do {
//     const graphQuery = `query {
//     users(where: {currentTotalDebt_gt: 0}, first: ${first},
//         skip: ${skip},) {
//       user {
//           id
//         }
//       currentTotalDebt
//       reserve {
//           underlyingAsset
//           symbol
//           name
//         }
//       }
//     }`;

//     const headers = {
//       "Content-Type": "application/json",
//     };

//     const response = await axios.post(
//       apiBlast,
//       { query: graphQuery },
//       { headers: { "Content-Type": "application/json" }, timeout: 300000 }
//     );

//     const batch = response.data;

//     if (batch.data.userReserves.length === 0) {
//       break;
//     }

//     batch.data.userReserves.forEach((data: any) => {
//       const asset = data.reserve.symbol.toLowerCase() as keyof IAsset;

//       if (assetDenomination[`${asset}`]) {
//         const userData = allBorrowersBlast.get(data.user.id.toLowerCase()) || {
//           borrow: {},
//         };

//         userData.borrow[asset] = Number(data.currentTotalDebt)
//           ? (Number(data.currentTotalDebt) / assetDenomination[`${asset}`]) *
//             Number(marketPrice[`${asset}`]);
//           : 0;

//         reservesMap.set(data.user.id.toLowerCase(), userData);
//       }
//     });
//   } while (batch.data.data.users.length === first);
//   console.log("done");
// };

// export const wrteBlastUsersToCsv = async () => {
//   const first = 1000;
//   let skip = 0;
//   // create csv
//   writeFileSync(
//     "blast_points_data.csv",
//     "walletAddress,updatedAt,createdAt,pointsPendingUSDB,pointsPendingWETH,pointsPending,PointsGivenUSDB,pointsGivenWETH,pointsGiven\n",
//     {
//       encoding: "utf-8",
//     }
//   );
//   do {
//     console.log("skipping", skip, "users");
//     const batch = await BlastUser.find({}).skip(skip).limit(first);

//     if (batch.length) {
//       skip += batch.length;
//     } else {
//       break;
//     }

//     batch.forEach((user) => {
//       appendFileSync(
//         "blast_points_data.csv",
//         `${user.walletAddress},${user.updatedAt},${user.createdAt},${user.blastPoints.pointsPendingUSDB},${user.blastPoints.pointsPendingWETH},${user.blastPoints.pointsPending},${user.blastPoints.pointsGivenUSDB},${user.blastPoints.pointsGivenWETH},${user.blastPoints.pointsGiven}\n`,
//         {
//           encoding: "utf-8",
//         }
//       );
//     });
//     console.log("stored in csv");
//     // eslint-disable-next-line no-constant-condition
//   } while (true);
//   console.log("done");
// };
