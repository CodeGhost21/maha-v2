// import axios from "axios";
// import { ethers } from "ethers";
// import { MulticallWrapper } from "ethers-multicall-provider";

// import { blastStartDate } from "./constants";
// import { blastProvider } from "../../utils/providers";
// import BlastPointABI from "../../abis/BlastPoints.json";
// import { BlastUser } from "../../database/models/blastUsers";
// import { BlastBatches } from "../../database/models/blastBatches";

// import { getBlastChallenge, getBearerToken, BlastData } from "./blast";

// const baseUrl = "https://waitlist-api.prod.blast.io";

// const assetAddress = [
//   "0x53a3Aa617afE3C12550a93BA6262430010037B04",
//   "0x29c2Bc372728dacB472A7E90e5fc8Aa0F203C8CD",
//   "0x23A58cbe25E36e26639bdD969B0531d3aD5F9c34",
//   "0x0e914b7669E97fd0c2644Af60E90EA7ddb4F91d1",
// ];
// const blastGoldAddress = "0xc2764d3ffbb6fbc3e1b1b5a6cc8369205a0a90dd";
// const contractAddress = "0x94Dc19a5bd17E84d90E63ff3fBA9c3B76E5E4012";

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

// //Blast Gold
// export const calculateBlastGoldUserShare = async (addresses: string[]) => {
//   const noOfDays = Math.floor(
//     Math.abs(blastStartDate - Date.now()) / (1000 * 60 * 60 * 24)
//   ); // no of days from incentives started
//   const totalShares = 86400 * noOfDays * 40;
//   const blastGold = await BlastData();

//   const provider = MulticallWrapper.wrap(blastProvider);

//   const blastPointContract = new ethers.Contract(
//     contractAddress,
//     BlastPointABI,
//     provider
//   );

//   const results = await Promise.all(
//     addresses.map((w) =>
//       blastPointContract.getUserRewards(assetAddress, w, blastGoldAddress)
//     )
//   );
//   const finalResults = results.map((amount: bigint, index) => {
//     const share = Number(amount) / 1e18;
//     const sharePercentage = share / totalShares;

//     return {
//       address: addresses[index],
//       shares: share,
//       sharePercentage: sharePercentage * 100,
//       goldWETH: Number(sharePercentage * blastGold.blastGoldWETH).toFixed(2),
//       gold: Number(sharePercentage * blastGold.blastGoldWETH).toFixed(2),
//     };
//   });
//   return finalResults;
// };

// export const saveBlastGoldUsers = async () => {
//   const first = 1000;
//   let batch;
//   let lastAddress = "0x0000000000000000000000000000000000000000";
//   const queryURL =
//     "https://api.studio.thegraph.com/query/65585/zerolend-blast-market/version/latest";
//   const bulkOperations = [];
//   const allBlastUsers = await BlastUser.find({}, { walletAddress: 1, _id: 0 });
//   const allBlastUsersAddress: any = allBlastUsers.map((user: any) =>
//     user.walletAddress.toLowerCase().trim()
//   );
//   do {
//     const graphQuery = `query {
//       users(where: {id_gt: "${lastAddress}"}, first: 1000) {
//         id
//       }
//     }`;

//     const headers = {
//       "Content-Type": "application/json",
//     };
//     batch = await axios.post(queryURL, { query: graphQuery }, { headers });
//     const addresses = batch.data.data.users.map((user: any) => user.id);
//     const userShares = await calculateBlastGoldUserShare(addresses);

//     for (const userShare of userShares) {
//       const walletAddress: any = userShare.address.toLowerCase().trim();
//       if (Number(userShare.gold) > 0) {
//         if (allBlastUsersAddress.includes(walletAddress)) {
//           bulkOperations.push({
//             updateOne: {
//               filter: { walletAddress },
//               update: {
//                 $set: {
//                   "blastGold.pointsPending": Number(userShare.gold),
//                   // "blastGold.pointsPendingUSDB": Number(userShare.goldUSDB),
//                   "blastGold.pointsPendingWETH": Number(userShare.goldWETH),
//                   "blastGold.shares": userShare.shares,
//                   "blastGold.sharePercent": userShare.sharePercentage,
//                   "blastGold.timestamp": Date.now(),
//                 },
//               },
//             },
//           });
//         } else {
//           bulkOperations.push({
//             insertOne: {
//               document: {
//                 walletAddress,
//                 blastGold: {
//                   pointsPending: Number(userShare.gold),
//                   // pointsPendingUSDB: Number(userShare.goldUSDB),
//                   pointsPendingWETH: Number(userShare.goldWETH),
//                   shares: userShare.shares,
//                   sharePercent: userShare.sharePercentage,
//                   timestamp: Date.now(),
//                 },
//               },
//             },
//           });
//         }
//       }
//     }

//     lastAddress = batch.data.data.users[batch.data.data.users.length - 1].id;
//   } while (batch.data.data.users.length === first);

//   if (bulkOperations.length > 0) {
//     await BlastUser.bulkWrite(bulkOperations);
//     console.log(
//       `Inserted ${bulkOperations.length} documents into BlastUser collection.`
//     );
//   }
// };

// export const assignBlastGold = async () => {
//   const batchSize = 2000;
//   let skip = 0;
//   let batch;
//   // const addressUSDB = "0x23A58cbe25E36e26639bdD969B0531d3aD5F9c34";
//   const addressWETH = "0x53a3Aa617afE3C12550a93BA6262430010037B04";
//   const challengeUSDB = await getBlastChallenge(addressWETH);
//   const tokenUSDB = await getBearerToken(challengeUSDB);
//   const tokenName = "WETH";
//   let batchId = 2842; //Math.floor(Date.now() / 86400 / 7 / 1000);
//   do {
//     //USDB
//     console.log("batchId", batchId);
//     batch = await BlastUser.find({
//       [`blastGold.pointsPending${tokenName}`]: { $gt: 0 },
//     })
//       .skip(skip)
//       .limit(batchSize);
//     const transferBatch = [];
//     if (batch.length > 0) {
//       for (const user of batch) {
//         if (user.blastGold[`pointsPending${tokenName}`] > 0) {
//           const transfer: Transfer = {
//             toAddress: user.walletAddress,
//             points: String(user.blastGold[`pointsPending${tokenName}`]),
//           };
//           transferBatch.push(transfer);
//         }
//       }
//       console.log(transferBatch.length);

//       const request: Request = {
//         pointType: "DEVELOPER",
//         transfers: transferBatch,
//         secondsToFinalize: 3600,
//       };
//       console.log(request);

//       const url = `${baseUrl}/v1/contracts/${addressWETH}/batches/${batchId}`;
//       const headers = {
//         Authorization: `Bearer ${tokenUSDB}`,
//       };
//       try {
//         const response = await axios.put(url, request, { headers });
//         console.log(response.data);
//         if (response.data.success) {
//           //saving batch
//           await BlastBatches.create({
//             batchId,
//             batch: transferBatch,
//           });
//         }
//       } catch (e: any) {
//         console.log(e.response.data);
//       }

//       skip += batchSize;
//       batchId += 1;
//     }
//   } while (batch.length === batchSize);
// };

// export const updateBlastGold = async () => {
//   const tokenName = "WETH";
//   const blastBatches = await BlastBatches.find({ batchId: { $gte: 2845 } });

//   blastBatches.forEach(async (batch: any) => {
//     const bulkOperations: any = [];
//     for (const item of batch.batch) {
//       bulkOperations.push({
//         updateOne: {
//           filter: { walletAddress: item.toAddress },
//           update: {
//             $inc: {
//               "blastGold.pointsGiven": Number(item.points),
//               "blastGold.pointsPending": -Number(item.points),
//             },
//             $set: {
//               [`blastGold.pointsPending${tokenName}`]: 0,
//               "blastGold.timestamp": Date.now(),
//             },
//           },
//         },
//       });
//     }
//     if (bulkOperations.length > 0) {
//       await BlastUser.bulkWrite(bulkOperations);
//       console.log(
//         `Updated ${bulkOperations.length} documents in BlastUser collection.`
//       );
//     }
//   });
// };

// export const getTotalBlastGoldGiven = async () => {
//   const result = await BlastUser.aggregate([
//     {
//       $group: {
//         _id: null,
//         totalPointsGiven: { $sum: "$blastGold.pointsGiven" },
//       },
//     },
//   ]);
//   console.log(result);
// };

// // const addresses = [
// //   "0x961e45e3666029709c3ac50a26319029cde4e067",
// //   "0xf152da370fa509f08685fa37a09ba997e41fb65b",
// //   "0x0000000002c0fd34c64a4813d6568abf13b0adda",
// //   "0x00087fd81bbfebcf10852753a47195a888e2a66f",
// //   "0x00c763ea9716c173b7406e926e84ce6394976f29",
// //   "0x00e59610cf047882a08daaad28b9e470356a12f0",
// //   "0x010506ad696ff2b9f757fe072dd35cae293e8deb",
// // ];
