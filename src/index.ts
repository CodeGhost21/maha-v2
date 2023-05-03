import cron from "node-cron";
import { submissions } from "./controller/zealyBot";
import { checkInfluencerLike } from "./controller/quests/tweetShill";
import { open } from "./database";

//connect to database
open();

const job = async () => {
  console.log("job started");
  cron.schedule("*/15 * * * *", async () => {
    console.log("running every 15 minute");
    await submissions();
    await checkInfluencerLike();
  });
};

job();
