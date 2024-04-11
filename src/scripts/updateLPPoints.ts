import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";
import _ from "underscore";

dotenv.config();
nconf
  .argv()
  .env()
  .file({ file: path.resolve("./config.json") });

import { open } from "../database";
import {
  IWalletUser,
  WalletUser,
  type IWalletUserPoints,
} from "../database/models/walletUsers";
import { AnyBulkWriteOperation } from "mongodb";

open();

export const updateHourlyLPPoints = async () => {
  const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
  const batchSize = 1000;
  let skip = 0;
  let batch;
  do {
    batch = await WalletUser.find().skip(skip).limit(batchSize);
    for (const user of batch) {
      const lpTasks: Array<keyof IWalletUserPoints> = [
        "supply",
        "borrow",
        "supplyManta",
        "borrowManta",
        "supplyLinea",
        "borrowLinea",
        "supplyBlast",
        "borrowBlast",
        "supplyEthereumLrt",
        "borrowEthereumLrt",
        "supplyEthereumLrtEth",
        "supplyLineaEzEth",
        "supplyBlastEzEth",
        "supplyEthereumLrtEzEth",
      ];

      for (const lpTask of lpTasks) {
        const timestamp = user.pointsPerSecondUpdateTimestamp[lpTask];
        const amount = user.pointsPerSecond[lpTask];

        const timeElapsed = (Date.now() - (timestamp || 0)) / 1000;
        const newPoints = Number(amount || 0) * timeElapsed;
        if (typeof newPoints === "number" && newPoints !== 0) {
          userBulkWrites.push({
            updateOne: {
              filter: { _id: user.id },
              update: {
                $inc: {
                  [`points.${lpTask}`]: newPoints,
                  totalPointsV2: newPoints,
                },
                $set: {
                  [`pointsPerSecondUpdateTimestamp.${lpTask}`]: Date.now(),
                },
              },
            },
          });
        }
      }
    }
    await WalletUser.bulkWrite(userBulkWrites);
    skip += batchSize;
  } while (batch.length === batchSize);
};
updateHourlyLPPoints();

// const updatePoints=async(userId:any,timestamp:number,amount:number,lpTask:string)=>{
//     const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];
//     const timeElapsed = (Date.now() - Number(timestamp || 0)) / 1000
//     const newPoints=Number(amount||0)* timeElapsed

//     await userBulkWrites.push({
//                 updateOne: {
//                   filter: { _id: userId },
//                   update: {
//                     $inc: {
//                       [`points.${lpTask}`]: newPoints,
//                       totalPointsV2: newPoints,
//                     },
//                     $set: {
//                         [`pointsPerSecondUpdateTimestamp.${lpTask}`]: Date.now(),
//                     }
//                   },
//                 },
//               });

//     return {
//         userBulkWrites,
//         execute: async () => {
//           await WalletUser.bulkWrite(userBulkWrites);
//         },
//       };
// }

// export const updateHourlyLPPointsNew=async()=>{
//   const userBulkWrites: AnyBulkWriteOperation<IWalletUser>[] = [];

//     const tasks: IAssignPointsTaskLP[] = [];
//     const batchSize = 1000;
//     let skip = 0;
//     let batch;
//     do{
//         batch=await WalletUser.find().skip(skip).limit(batchSize);
//         for (const user of batch) {

//           const lpTasks: Array<keyof IWalletUserPoints> = ["supply", "borrow"]

//           for (const lpTask of lpTasks) {
//             const timestamp = user.pointsPerSecondUpdateTimestamp[lpTask];
//             const amount = user.pointsPerSecond[lpTask];
//             console.log(timestamp);
//             console.log(amount);

//                 const timeElapsed = (Date.now() - (timestamp || 0)) / 1000;
//                 const newPoints = Number(amount || 0) * timeElapsed;

//                 userBulkWrites.push({
//                   updateOne: {
//                       filter: { _id: user.id },
//                       update: {
//                           $inc: {
//                               [`points.${lpTask}`]: newPoints,
//                               totalPointsV2: newPoints,
//                           },
//                           $set: {
//                               [`pointsPerSecondUpdateTimestamp.${lpTask}`]: Date.now(),
//                           }
//                       },
//                   },
//               });
//           }
//             //zksync
//             const supplyZksync = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.supply,user.pointsPerSecond.supply,'supply');
//             if (supplyZksync) tasks.push(supplyZksync);

//             const borrowZksync = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.borrow,user.pointsPerSecond.borrow,'borrow');
//             if (borrowZksync) tasks.push(borrowZksync);

//             //manta
//             const supplyManta = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.supplyManta,user.pointsPerSecond.supplyManta,'supplyManta');
//             if (supplyManta) tasks.push(supplyManta);

//             const borrowManta = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.borrowManta,user.pointsPerSecond.borrowManta,'borrowManta');
//             if (borrowManta) tasks.push(borrowManta);

//             //linea
//             const supplyLinea = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.supplyLinea,user.pointsPerSecond.supplyLinea,'supplyLinea');
//             if (supplyLinea) tasks.push(supplyLinea);

//             const borrowLinea = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.borrowLinea,user.pointsPerSecond.borrowLinea,'borrowLinea');
//             if (borrowLinea) tasks.push(borrowLinea);

//             //blast
//             const supplyBlast = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.supplyBlast,user.pointsPerSecond.supplyBlast,'supplyBlast');
//             if (supplyBlast) tasks.push(supplyBlast);

//             const borrowBlast = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.borrowBlast,user.pointsPerSecond.borrowBlast,'borrowBlast');
//             if (borrowBlast) tasks.push(borrowBlast);

//             //ethereum Lrt
//             const supplyEthereumLrt = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.supplyEthereumLrt,user.pointsPerSecond.supplyEthereumLrt,'supplyEthereumLrt');
//             if (supplyEthereumLrt) tasks.push(supplyEthereumLrt);

//             const borrowEthereumLrt = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.borrowEthereumLrt,user.pointsPerSecond.borrowEthereumLrt,'borrowEthereumLrt');
//             if (borrowEthereumLrt) tasks.push(borrowEthereumLrt);

//             //ethereum Lrt Eth
//             const supplyEthereumLrtEth = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.supplyEthereumLrtEth,user.pointsPerSecond.supplyEthereumLrtEth,'supplyEthereumLrtEth');
//             if (supplyEthereumLrtEth) tasks.push(supplyEthereumLrtEth);

//             //Linea EzEth
//             const supplyLineaEzEth = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.supplyLineaEzEth,user.pointsPerSecond.supplyLineaEzEth,'supplyLineaEzEth');
//             if (supplyLineaEzEth) tasks.push(supplyLineaEzEth);

//             //Blast EzEth
//             const supplyBlastEzEth = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.supplyBlastEzEth,user.pointsPerSecond.supplyBlastEzEth,'supplyBlastEzEth');
//             if (supplyBlastEzEth) tasks.push(supplyBlastEzEth);

//             //EthereumLrt EzEth
//             const supplyEthereumLrtEzEth = await updatePoints(user.id,user.pointsPerSecondUpdateTimestamp.supplyEthereumLrtEzEth,user.pointsPerSecond.supplyEthereumLrtEzEth,'supplyEthereumLrtEzEth');
//             if (supplyEthereumLrtEzEth) tasks.push(supplyEthereumLrtEzEth);

//         }
//         await WalletUser.bulkWrite(userBulkWrites);
//         skip += batchSize
//     } while (batch.length === batchSize)
// }
// updateHourlyLPPointsNew()
