import { open } from "./database";
import cron from "node-cron";
import { dailyLpPoints } from "./cron/dailyLpPoints";
import { updateRank } from "./cron/updateRank";

// connect to database
open();

cron.schedule("*/30 * * * *", async () => {
  console.log("running a lp points every 30 minutes");
  await dailyLpPoints();
});

cron.schedule("*/5 * * * *", async () => {
  console.log("updating rank every 5 minutes");
  await updateRank();
});

// updateRank();
dailyLpPoints();
