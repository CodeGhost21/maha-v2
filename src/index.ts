import bodyParser from "body-parser";
import nconf from "nconf";
import express from "express";
import * as http from "http";
import cors from "cors";
import cron from "node-cron";
import { submissions } from "./controller/zealyBot";

import "./bots/gm";
import {
  checkInfluencerLike,
  checkRetweet,
} from "./controller/quests/tweetShill";

import { open } from "./database";

const app = express();
const server = new http.Server(app);

//connect to database
open();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const job = async () => {
  console.log("job started");
  cron.schedule("*/15 * * * *", async () => {
    console.log("running every 15 minute");
    await submissions();
    // await checkInfluencerLike();
    // await checkRetweet();
  });
};
job();

app.set("port", nconf.get("PORT") || 5001);
const port = app.get("port");
server.listen(port, () => console.log(`Server started on port ${port}`));
