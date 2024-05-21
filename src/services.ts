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
import { addToQueue, isQueueEmpty } from "./cron/queue";

// connect to database
open();
let isUpdatingPoints = false;

// -------------  Update LP Rate  -----------------
cron.schedule("30 14 * * * *", () => {
  addToQueue(async () => {
    console.log("running zksyn lp points every day at 2:30 pm");
    await zksyncPPSCron();
  });
});

cron.schedule("30 15 * * * *", () => {
  addToQueue(async () => {
    console.log("running manta lp points every day at 3:30 pm");
    await mantaPPSCron();
  });
});

cron.schedule("0 17 * * * *", () => {
  addToQueue(async () => {
    console.log("running blast lp points every day at 5 pm");
    await blastPPSCron();
  });
});

cron.schedule("30 18 * * * *", () => {
  addToQueue(async () => {
    console.log("running ethereumLrt lp points every day at 6:30 pm");
    await ethereumLrtPPSCron();
  });
});

cron.schedule("0 20 * * * *", () => {
  addToQueue(async () => {
    console.log("running linea lp points every day at 8 pm");
    await lineaPPSCron();
  });
});

cron.schedule("30 21 * * * *", () => {
  addToQueue(async () => {
    console.log("running xLayer lp points every day at 9:30 pm");
    await xLayerPPSCron();
  });
});

// -------------  Update Rank  -----------------
cron.schedule("0 23 * * *", () => {
  addToQueue(async () => {
    console.log("updating rank every day at 11pm");
    await updateUsersRank();
  });
});

// -------------  Add Users  -----------------
cron.schedule("30 00 * * *", () => {
  addToQueue(async () => {
    console.log("adding new wallet users every day at 12:30 am");
    await addUsers();
  });
});

// -------------  Update LP Points  -----------------
cron.schedule("*/60 * * * *", async () => {
  if (isQueueEmpty() && !isUpdatingPoints) {
    isUpdatingPoints = true;
    console.log("running lp points every 1 hour");
    await updateLPPointsHourly();
    isUpdatingPoints = false;
  } else {
    console.log("skipping update points hourly");
  }
});
