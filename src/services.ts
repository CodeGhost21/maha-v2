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
cron.schedule(
  "05 1 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running zksyn lp points every day at 1:05 am");
      await zksyncPPSCron();
    });
  },
  { timezone: "Asia/Kolkata" }
  );

cron.schedule(
  "35 2 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running manta lp points every day at 2:35 am");
      await mantaPPSCron();
    });
  },
  { timezone: "Asia/Kolkata" }
);

cron.schedule(
  "05 4 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running blast lp points every day at 4:05 am");
      await blastPPSCron();
    });
  },
  { timezone: "Asia/Kolkata" }
);

cron.schedule(
  "35 5 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running ethereumLrt lp points every day at 5:35 am");
      await ethereumLrtPPSCron();
    });
  },
  { timezone: "Asia/Kolkata" }
);

cron.schedule(
  "05 7 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running linea lp points every day at 7:05 am");
      await lineaPPSCron();
    });
  },
  { timezone: "Asia/Kolkata" }
);

cron.schedule(
  "35 8 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running xLayer lp points every day at 8:35 am");
      await xLayerPPSCron();
    });
  },
  { timezone: "Asia/Kolkata" }
);

// -------------  Update Rank  -----------------
cron.schedule(
  "05 10 * * *",
  async () => {
    addToQueue(async () => {
      console.log("updating rank every day at 10:05 am");
      await updateUsersRank();
    });
  },
  { timezone: "Asia/Kolkata" }
);

// -------------  Add Users  -----------------
cron.schedule(
  "35 11 * * *",
  async () => {
    addToQueue(async () => {
      console.log("adding new wallet users every day at 11:35 am");
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
