import { open } from "./database";
import cron from "node-cron";
import { dailyLpPoints } from "./cron/dailyLpPoints";
import { updateUsersRank } from "./cron/updateRank";
import { updatePythPoints } from "./scripts/updatePythPoints";
import { updateMantaPoints } from "./scripts/updateMantaPoints";
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

cron.schedule("0 23 * * 4", async () => {
  console.log("updating pyth points every Thursday at 3 PM minutes");
  await updatePythPoints();
});

cron.schedule("0 15 * * 6", async () => {
  console.log("updating manta points every saturday at 3 PM minutes");
  await updateMantaPoints();
});
// updateRank();
// dailyLpPoints();
