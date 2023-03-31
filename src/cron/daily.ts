import cron from "node-cron";

import { nftHoldTask } from "../controller/loyaltyTask/nftHold";
import { twitterFollowTask } from "../controller/task/twitterFollow";

export const dailyLoyaltyChecks = async () => {
  cron.schedule("0 0 * * *", () => {
    console.log("running daily loyalty checks");
    nftHoldTask();
    twitterFollowTask();
  });
};
