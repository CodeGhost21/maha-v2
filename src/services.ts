import { open } from "./database";
import cron from "node-cron";
import { dailyLpPoints } from "./cron/dailyLpPoints";
import { updateUsersRank } from "./cron/updateRank";

// connect to database
open();

cron.schedule("*/20 * * * *", async () => {
  console.log("running lp points every 20 minutes");
  await dailyLpPoints();
});

cron.schedule("*/5 * * * *", async () => {
  console.log("updating rank every 5 minutes");
  await updateUsersRank();
});
// updateRank();
// dailyLpPoints();
