import { open } from "./database";
import cron from "node-cron";
import { dailyLpPoints } from "./cron/dailyLpPoints";
import { updateUsersRank } from "./cron/updateRank";
import { totalPoints } from "./cron/totalPoints";
import "./bots/gm";
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

cron.schedule("0 * * * *", async () => {
  console.log("updating totalPoints every hour");
  await totalPoints();
});
// updateRank();
// dailyLpPoints();
