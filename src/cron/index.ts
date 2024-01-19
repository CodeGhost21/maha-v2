import cron from "node-cron";
import { updateRank } from "./updateRank";
import { dailyLpPoints } from "./dailyLpPoints";
import { updateLBCache } from "./updateLBCache";

// cron.schedule("*/5 * * * *", async () => {
//   console.log("running a task every 5 minutes");
//   await dailyLpPoints();
// });

// cron.schedule("*/10 * * * *", async () => {
//   console.log("running a task every 10 minutes");
//   await updateRank();
// });

cron.schedule("*/10 * * * *", async () => {
  console.log("running a task every 10 minutes");
  await updateLBCache();
});

updateLBCache();
