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
  "55 00 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running zksyn lp points every day at 1 pm");
      await zksyncPPSCron();
    });
  },
  { timezone: "UTC" }
  );

cron.schedule(
  "05 2 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running manta lp points every day at 2:30 pm");
      await mantaPPSCron();
    });
  },
  { timezone: "UTC" }
);

cron.schedule(
  "05 3 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running blast lp points every day at 4 pm");
      await blastPPSCron();
    });
  },
  { timezone: "UTC" }
);

cron.schedule(
  "05 4 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running ethereumLrt lp points every day at 5:30 pm");
      await ethereumLrtPPSCron();
    });
  },
  { timezone: "UTC" }
);

cron.schedule(
  "05 6 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running linea lp points every day at 7 pm");
      await lineaPPSCron();
    });
  },
  { timezone: "UTC" }
);

cron.schedule(
  "05 7 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running xLayer lp points every day at 8:30 pm");
      await xLayerPPSCron();
    });
  },
  { timezone: "UTC" }
);

// -------------  Update Rank  -----------------
cron.schedule(
  "05 8 * * *",
  async () => {
    addToQueue(async () => {
      console.log("updating rank every day at 10 pm");
      await updateUsersRank();
    });
  },
  { timezone: "UTC" }
);

// -------------  Add Users  -----------------
cron.schedule(
  "05 9 * * *",
  async () => {
    addToQueue(async () => {
      console.log("adding new wallet users every day at 11:30 am");
      await addUsers();
    });
  },
  { timezone: "UTC" }
);

// -------------  Update LP Points hourly -----------------
cron.schedule(
  "*/59 * * * *",
  async () => {
    if (isQueueEmpty() && !isUpdatingPoints) {
      isUpdatingPoints = true;
      console.log("running lp points once in every 2 hours");
      addToQueue(async () => await updateLPPointsHourly());
      isUpdatingPoints = false;
    } else {
      console.log("skipping update points hourly");
    }
  },
  { timezone: "UTC" }
);
