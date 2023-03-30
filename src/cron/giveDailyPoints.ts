// todo
const cron = require("node-cron");

import { nftHoldTask } from "../controller/task.ts/nftHold";
import { twitterFollowTask } from "../controller/task.ts/twitterFollow";

export const dailyPoints = async () => {
  cron.schedule("0 0 * * *", () => {
    console.log("Running every Day");
    nftHoldTask();
    twitterFollowTask();
  });
};
