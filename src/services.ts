import { open } from "./database";
import cron from "node-cron";
import { dailyLpPoints } from "./cron/dailyLpPoints";
import { updateUsersRank } from "./cron/updateRank";
import "./bots/gm";
import {
  mantaCron,
  zksyncCron,
  lineaCron,
  ethereumLrtCron,
  blastCron,
  xLayerCron,
} from "./cron/dailyLpPointsChain.v2";
import { addUsers } from "./scripts/newSupplyBorrowUsers";
// connect to database
open();

// cron.schedule("*/60 * * * *", async () => {
//   console.log("running lp points every hour");
//   await dailyLpPoints();
// });


cron.schedule("0 8 * * *", async () => {
  console.log("updating rank every day at 8am");
  await updateUsersRank();
});

cron.schedule("0 9 * * *", async () => {
  console.log("adding new wallet users every day at 9 am");
  await addUsers();
});

// updateLPRate
cron.schedule("0 1 * * * *", async () => {
  console.log("running zksyn lp points every day at 1 am");
  await zksyncCron();
});

cron.schedule("0 2 * * * *", async () => {
  console.log("running manta lp points every day at 2 am");
  await mantaCron();
});

cron.schedule("0 3 * * * *", async () => {
  console.log("running blast lp points every day at 3 am");
  await blastCron();
});

cron.schedule("0 4 * * * *", async () => {
  console.log("running ethereumLrt lp points every day at 4 am");
  await ethereumLrtCron();
});

cron.schedule("0 5 * * * *", async () => {
  console.log("running linea lp points every day at 5 am");
  await lineaCron();
});

cron.schedule("0 6 * * * *", async () => {
  console.log("running xLayer lp points every day at 6 am");
  await xLayerCron();
});

