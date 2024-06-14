import { open } from "./database";
import cron from "node-cron";
import { updateUsersRank } from "./cron/updateRank";

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
cron.schedule(
  "30 12 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running lp points every day at 12:30 am");
        await zksyncPPSCron(),
        await mantaPPSCron(),
        await blastPPSCron(),
        await ethereumLrtPPSCron(),
        await lineaPPSCron(),
        await xLayerPPSCron()
    });
  },
  { timezone: "Asia/Kolkata" }
);


// -------------  Update Rank  -----------------
cron.schedule(
  "05 7 * * *",
  async () => {
    addToQueue(async () => {
      console.log("updating rank every day at 7:05 am");
      await updateUsersRank();
    });
  },
  { timezone: "Asia/Kolkata" }
);

// -------------  Add Users  -----------------
cron.schedule(
  "05 9 * * *",
  async () => {
    addToQueue(async () => {
      console.log("adding new wallet users every day at 9:05 am");
      await addUsers();
    });
  },
  { timezone: "Asia/Kolkata" }
);

// -------------  Update LP Points hourly -----------------
cron.schedule(
  "*/59 * * * *",
  async () => {
    if (isQueueEmpty() && !isUpdatingPoints) {
      isUpdatingPoints = true;
      console.log("running lp points once every hour");
      addToQueue(async () => await updateLPPointsHourly());
      isUpdatingPoints = false;
    } else {
      console.log("skipping update points hourly");
    }
  },
  { timezone: "Asia/Kolkata" }
);
