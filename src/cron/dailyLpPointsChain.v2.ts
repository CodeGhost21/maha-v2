import { apiMaha, ethLrtMultiplier } from "../controller/quests/constants";
import { lpRateHourly } from "./updateRatesHourly";

export const mahaPPSCron = async () => {
  console.log("starting maha-v2 points per second calculations");
  lpRateHourly(apiMaha, ethLrtMultiplier);
};
