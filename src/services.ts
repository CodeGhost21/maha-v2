import cron from "node-cron";
import { open } from "./database";
import { updateUsersRank } from "./cron/updateRank";

import {
  mantaPPSCron,
  zksyncPPSCron,
  lineaPPSCron,
  ethereumLrtPPSCron,
  blastPPSCron,
  xLayerPPSCron,
} from "./cron/dailyLpPointsChain.v2";
import { updateLPPointsHourly } from "./cron/lpPointshourly";
import { addToQueue, isQueueEmpty } from "./cron/queue";
import { getPriceCoinGecko } from "./controller/quests/onChainPoints";

// connect to database
open();
// let isUpdatingPoints = false;
// console.log("starting");

// // -------------  Update LP Rate  -----------------
// cron.schedule(
//   "0 */4 * * *",
//   async () => {
//     addToQueue(async () => {
//       console.log("running lp points every 4 hours");
//       // always execute linea first to calculate staking boost
//       const cronJobs = [
//         lineaPPSCron,
//         zksyncPPSCron,
//         mantaPPSCron,
//         blastPPSCron,
//         ethereumLrtPPSCron,
//         xLayerPPSCron,
//       ];

//       for (const job of cronJobs) {
//         try {
//           await job();
//         } catch (error) {
//           console.error(`Error occurred in ${job.name}:`, error);
//         }
//       }
//     });
//   },
//   { timezone: "Asia/Kolkata" }
// );

// // -------------  Update Rank  -----------------
// cron.schedule(
//   "05 7 * * *",
//   async () => {
//     addToQueue(async () => {
//       console.log("updating rank every day at 7:05 am");
//       await updateUsersRank();
//     });
//   },
//   { timezone: "Asia/Kolkata" }
// );

// // -------------  Update LP Points hourly -----------------
// cron.schedule(
//   "*/57 * * * *",
//   async () => {
//     if (isQueueEmpty() && !isUpdatingPoints) {
//       isUpdatingPoints = true;
//       console.log("running lp points once every hour");
//       addToQueue(async () => await updateLPPointsHourly());
//       isUpdatingPoints = false;
//     } else {
//       console.log("skipping update points hourly");
//     }
//   },
//   { timezone: "Asia/Kolkata" }
// );
getPriceCoinGecko().then((p)=>console.log(p))
