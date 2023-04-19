import cron from "node-cron";
import { submissions } from "./controller/zealyBot";

const job = async () => {
  console.log("job started");
  cron.schedule("*/5 * * * *", () => {
    console.log("running every 5 minute");
    submissions();
  });
};

job();
