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
console.log("starting");

// -------------  Update LP Rate  -----------------
cron.schedule("0 1 * * *", async () => {
  await addToQueue(async () => {
    console.log("running zksyn lp points every day at 2:30 pm");
    await zksyncPPSCron();
    await updateLPPointsHourly();
  });
});

cron.schedule("30 2 * * *", async () => {
  await addToQueue(async () => {
    console.log("running manta lp points every day at 3:30 pm");
    await mantaPPSCron();
    await updateLPPointsHourly();
  });
});

cron.schedule("0 4 * * *", async () => {
  await addToQueue(async () => {
    console.log("running blast lp points every day at 5 pm");
    await blastPPSCron();
    await updateLPPointsHourly();
  });
});

cron.schedule("30 5 * * *", async () => {
  await addToQueue(async () => {
    console.log("running ethereumLrt lp points every day at 6:30 pm");
    await ethereumLrtPPSCron();
    await updateLPPointsHourly();
  });
});

cron.schedule("0 7 * * *", async () => {
  await addToQueue(async () => {
    console.log("running linea lp points every day at 8 pm");
    await lineaPPSCron();
    await updateLPPointsHourly();
  });
});

cron.schedule("30 8 * * *", async () => {
  await addToQueue(async () => {
    console.log("running xLayer lp points every day at 9:30 pm");
    await xLayerPPSCron();
    await updateLPPointsHourly();
  });
});

// -------------  Update Rank  -----------------
cron.schedule("0 10 * * *", () => {
  addToQueue(async () => {
    console.log("updating rank every day at 11pm");
    await updateUsersRank();
  });
});

// -------------  Add Users  -----------------
cron.schedule("30 11 * * *", async () => {
  await addToQueue(async () => {
    console.log("adding new wallet users every day at 12:30 am");
    await addUsers();
  });
});

// -------------  Update LP Points hourly -----------------
cron.schedule("*/60 * * * *", async () => {
  if (isQueueEmpty() && !isUpdatingPoints) {
    isUpdatingPoints = true;
    console.log("running lp points every 1 hour");
    addToQueue(async () => await updateLPPointsHourly());
    isUpdatingPoints = false;
  } else {
    console.log("skipping update points hourly");
  }
});
