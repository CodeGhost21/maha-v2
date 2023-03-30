import { dailyPoints } from "./giveDailyPoints";

export const init = () => {
  console.log("init cron job");
  dailyPoints();
};
