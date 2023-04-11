import cron from "node-cron";

import { checkNftHoldTaskForAll } from "../controller/loyaltyTask/nftHold";
import { checkTwitterFollowTaskForEveryone } from "../controller/loyaltyTask/twitterFollow";
import { executeRetweetTask } from "../controller/task/retweet";

export const dailyLoyaltyChecks = async () => {
  cron.schedule("0 0 * * *", () => {
    console.log("running daily loyalty checks");
    checkNftHoldTaskForAll();
    checkTwitterFollowTaskForEveryone();
  });
};

export const everyFifthDayTaskCheck = async () => {
  cron.schedule("* * * * *", () => {
    console.log("every 5th day-of-month.");
    executeRetweetTask();
  });
};
