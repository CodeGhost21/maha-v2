import { dailyLoyaltyChecks } from "./daily";

export const init = () => {
  console.log("init cron job");
  dailyLoyaltyChecks();
};
