import bodyParser from "body-parser";
import nconf from "nconf";
import express from "express";
import * as http from "http";
import cors from "cors";
import Routes from "./routes";
// import cron from "node-cron";
import { twitterMentions } from "./controller/twitter";

import "./bots/gm";

import { open } from "./database";

const app = express();
const server = new http.Server(app);

//connect to database
open();

twitterMentions();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(Routes);
app.set("port", nconf.get("PORT") || 5001);
const port = app.get("port");
server.listen(port, () => console.log(`Server started on port ${port}`));
