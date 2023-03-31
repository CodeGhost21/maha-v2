import cron from "node-cron";

import { nftHoldTask } from "../controller/loyaltyTask/nftHold";
import { checkTwitterFollowTaskForEveryone } from "../controller/loyaltyTask/twitterFollow";

export const dailyLoyaltyChecks = async () => {
  cron.schedule("0 0 * * *", () => {
    console.log("running daily loyalty checks");
    nftHoldTask();
    checkTwitterFollowTaskForEveryone();
  });
};
