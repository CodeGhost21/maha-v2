import { dailyLoyaltyChecks } from "./dailyLoyaltyChecks";

export const init = () => {
  console.log("init cron job");
  dailyLoyaltyChecks();
};
