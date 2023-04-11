import {
  dailyLoyaltyChecks,
  everyFifthDayTaskCheck,
} from "./dailyLoyaltyChecks";

export const init = () => {
  console.log("init cron job");
  dailyLoyaltyChecks();
  everyFifthDayTaskCheck();
};
