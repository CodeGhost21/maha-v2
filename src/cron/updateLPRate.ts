import { UserPointTransactions } from "../database/models/userPointTransactions";
// import {
//   IAssignPointsTask,
//   assignPointsLP,
// } from "../controller/quests/assignPoints";
// import {
//   supplyBorrowPointsMantaMulticall,
//   supplyBorrowPointsZksyncMulticall,
//   supplyBorrowPointsBlastMulticall,
//   supplyBorrowPointsLineaMulticall,
//   supplyBorrowPointsEthereumLrtMulticall,
//   supplyBorrowPointsEthereumLrtETHMulticall,
//   supplyPointsBlastEzETHMulticall,
//   supplyPointsEthereumLrtEzETHMulticall,
//   supplyPointsLineaEzETHMulticall,
//   supplyPointsZksyncLidoMulticall,
//   supplyPointsEthereumLrtRsETHMulticall,
// } from "../controller/quests/onChainPoints";
import _ from "underscore";
import {
  IWalletUserModel,
  WalletUserV2,
} from "../database/models/walletUsersV2";
import { getEpoch } from "../utils/epoch";

// const _processBatch = async (userBatch: IWalletUserModel[], epoch: number) => {
//   try {

//     // get manta data
//     const mantaData = await supplyBorrowPointsMantaMulticall(userBatch);
//     const zksyncData = await supplyBorrowPointsZksyncMulticall(userBatch);
//     const blastData = await supplyBorrowPointsBlastMulticall(userBatch);
//     const lineaData = await supplyBorrowPointsLineaMulticall(userBatch);
//     const ethLrtData = await supplyBorrowPointsEthereumLrtMulticall(userBatch);
//     const ethLrtEthData = await supplyBorrowPointsEthereumLrtETHMulticall(userBatch);
//     const lineaEzEthData = await supplyPointsLineaEzETHMulticall(userBatch);
//     const blastEzEthData = await supplyPointsBlastEzETHMulticall(userBatch);
//     const ethLrtEzEthData = await supplyPointsEthereumLrtEzETHMulticall(userBatch);
//     const ethLrtRsEthData = await supplyPointsEthereumLrtRsETHMulticall(userBatch);
//     const zkSyncLidoData = await supplyPointsZksyncLidoMulticall(userBatch);
//     const tasks: IAssignPointsTask[] = [];

//     for (let j = 0; j < userBatch.length; j++) {
//       const user = userBatch[j];
//       const zksync = zksyncData[j];
//       const manta = mantaData[j];
//       const blast = blastData[j];
//       const linea = lineaData[j];
//       const ethLrt = ethLrtData[j];
//       const ethLrtEth = ethLrtEthData[j];
//       const lineaEzEth = lineaEzEthData[j];
//       const blastEzEth = blastEzEthData[j];
//       const ethLrtEzEth = ethLrtEzEthData[j];
//       const ethLrtRsEth = ethLrtRsEthData[j];
//       const zksyncLido = zkSyncLidoData[j];

//       if (
//         manta.supply.points === 0 &&
//         zksync.supply.points === 0 &&
//         blast.supply.points === 0 &&
//         linea.supply.points === 0 &&
//         ethLrt.supply.points === 0
//       ) {
//         tasks.push({
//           userBulkWrites: [
//             {
//               updateOne: {
//                 filter: { _id: user.id },
//                 update: { $set: { epoch } },
//               },
//             },
//           ],
//           pointsBulkWrites: [],
//           execute: async () => {
//             return;
//           },
//         });
//       }

//       //manta
//       if (manta.supply.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           manta.supply.points,
//           true,
//           "supplyManta",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       if (manta.borrow.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           manta.borrow.points,
//           true,
//           "borrowManta",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       //zksync
//       if (zksync.supply.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           zksync.supply.points,
//           true,
//           "supply",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       if (zksync.borrow.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           zksync.borrow.points,
//           // `Daily Borrow on zksync chain for ${zksync.borrow.amount}`,
//           true,
//           "borrow",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       //blast
//       if (blast.supply.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           blast.supply.points,
//           true,
//           "supplyBlast",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       if (blast.borrow.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           blast.borrow.points,
//           // `Daily Borrow on blast chain for ${blast.borrow.amount}`,
//           true,
//           "borrowBlast",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       //linea
//       if (linea.supply.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           linea.supply.points,
//           true,
//           "supplyLinea",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       if (linea.borrow.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           linea.borrow.points,
//           // `Daily Borrow on linea chain for ${linea.borrow.amount}`,
//           true,
//           "borrowLinea",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       //ethereum Lrt
//       if (ethLrt.supply.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           ethLrt.supply.points,
//           true,
//           "supplyEthereumLrt",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       if (ethLrt.borrow.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           ethLrt.borrow.points,
//           // `Daily Borrow on ethLrt chain for ${ethLrt.borrow.amount}`,
//           true,
//           "borrowEthereumLrt",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       //ethereum Lrt ETH
//       if (ethLrtEth.supply.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           ethLrtEth.supply.points,
//           true,
//           "supplyEthereumLrtEth",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       //linea ezEth
//       if (lineaEzEth.supply.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           lineaEzEth.supply.points,
//           true,
//           "supplyLineaEzEth",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       //blast ezEth
//       if (blastEzEth.supply.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           blastEzEth.supply.points,
//           true,
//           "supplyBlastEzEth",
//           epoch
//         );
//         if (t) tasks.push(t);
//       }

//       //ethereumLrt ezEth
//       if (ethLrtEzEth.supply.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           ethLrtEzEth.supply.points,
//           true,
//           "supplyEthereumLrtEzEth",
//           epoch
//         );

//         if (t) tasks.push(t);
//       }

//       //ethereumLrt rsEth
//       if (ethLrtRsEth.supply.points > 0) {
//         const t = await assignPointsLP(
//           user.id,
//           ethLrtRsEth.supply.points,
//           true,
//           "supplyEthereumLrtRsEth",
//           epoch
//         );

//         if (t) tasks.push(t);
//       }
//     }

//     // once all the db operators are accumulated; write into the DB
//     await WalletUserV2.bulkWrite(_.flatten(tasks.map((r) => r.userBulkWrites)));
//     await UserPointTransactions.bulkWrite(
//       _.flatten(tasks.map((r) => r.pointsBulkWrites))
//     );
//   } catch (error) {
//     console.log("processBatch error", error);
//   }
// };

// const _updateLPRate = async (from: number, count: number, migrate = false) => {
//   const epoch = getEpoch();
//   console.log("working with epoch", epoch);

//   const query = migrate
//     ? {
//         walletAddress: { $exists: true, $ne: null, $not: { $eq: "" } },
//         isDeleted: false,
//         $or: [{ epoch: 0 }, { epoch: undefined }],
//       }
//     : {
//         walletAddress: { $exists: true, $ne: null, $not: { $eq: "" } },
//         isDeleted: false,
//         epoch: { $ne: epoch },
//       };

//   const users = await WalletUserV2.find(query)
//     .limit(count)
//     .skip(from)
//     .select(["walletAddress"]);

//   const chunk = 100;

//   const loops = Math.floor(users.length / chunk) + 1;
//   console.log(loops, users.length, from, count);

//   for (let i = 0; i < loops; i++) {
//     try {
//       console.log("working on batch", i);
//       const userBatch = users.slice(i * chunk, (i + 1) * chunk);
//       await _processBatch(userBatch, epoch);
//     } catch (error) {
//       console.log("error", error);
//       console.log("failure working with batch", i);
//     }
//   }

//   console.log("done");
// };

// let lock = false;
// export const updateLPRate = async (migrate = false) => {
//   if (lock) return;
//   lock = true;

//   try {
//     const count = await WalletUserV2.count({});
//     await _updateLPRate(0, count, migrate);
//   } catch (error) {
//     console.log("cron failed beacuse of", error);
//   }

//   lock = false;
// };
