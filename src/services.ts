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
import { updateLPPointsHourly } from "./cron/lpPointshourly";
import { addToQueue, isQueueEmpty } from "./cron/queue";
import { distributeBlastPoints } from "./controller/quests/blastPoints";

// connect to database
open();
let isUpdatingPoints = false;
console.log("starting");

// -------------  Update LP Rate  -----------------
cron.schedule(
  "0 */4 * * *",
  async () => {
    addToQueue(async () => {
      console.log("running lp points every 4 hours");
      await zksyncPPSCron(),
        await mantaPPSCron(),
        await blastPPSCron(),
        await ethereumLrtPPSCron(),
        await lineaPPSCron(),
        await xLayerPPSCron();
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

cron.schedule(
  "05 22 * * *",
  async () => {
    console.log("Distributing blast points every day at 10:30 pm");
    await distributeBlastPoints();
  },
  { timezone: "Asia/Kolkata" }
);

// -------------  Update LP Points hourly -----------------
cron.schedule(
  "*/57 * * * *",
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
