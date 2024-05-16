import { open } from "./database";
import cron from "node-cron";
import { updateUsersRank } from "./cron/updateRank";
import "./bots/gm";
import {
  mantaPPSCron,
  zksyncPPSCron,
  lineaPPSCron,
  ethereumLrtPPSCron,
  blastPPSCron,
  xLayerPPSCron,
} from "./cron/dailyLpPointsChain.v2";
import { addUsers } from "./scripts/newSupplyBorrowUsers";
import { updateLPPointsHourly } from "./cron/lpPointshourly";
// connect to database
open();

// -------------  Update LP Rate  -----------------
cron.schedule("0 1 * * * *", async () => {
  console.log("running zksyn lp points every day at 1 am");
  await zksyncPPSCron();
});

cron.schedule("0 2 * * * *", async () => {
  console.log("running manta lp points every day at 2 am");
  await mantaPPSCron();
});

cron.schedule("0 3 * * * *", async () => {
  console.log("running blast lp points every day at 3 am");
  await blastPPSCron();
});

cron.schedule("0 4 * * * *", async () => {
  console.log("running ethereumLrt lp points every day at 4 am");
  await ethereumLrtPPSCron();
});

cron.schedule("0 5 * * * *", async () => {
  console.log("running linea lp points every day at 5 am");
  await lineaPPSCron();
});

cron.schedule("0 6 * * * *", async () => {
  console.log("running xLayer lp points every day at 6 am");
  await xLayerPPSCron();
});

// -------------  Update LP Points  -----------------
cron.schedule("*/60 * * * *", async () => {
  console.log("running lp points every 1 hour");
  await updateLPPointsHourly();
});

// -------------  Update Rank  -----------------
cron.schedule("0 9 * * *", async () => {
  console.log("updating rank every day at 9am");
  await updateUsersRank();
});

// -------------  Add Users  -----------------
cron.schedule("0 10 * * *", async () => {
  console.log("adding new wallet users every day at 10 am");
  await addUsers();
});
