import bodyParser from "body-parser";
import nconf from "nconf";
import express from "express";
import * as http from "http";
import cors from "cors";
import cron from "node-cron";
import passport from "passport";
import session from "express-session";

import { dailyPointsSystem } from "./controller/user";
import { open } from "./database";
import Routes from "./routes";

import "./strategies";
import "./bots/gm";

const app = express();
const server = new http.Server(app);

//connect to database
open();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    secret: nconf.get("SESSION_SECRET"),
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
  })
);

app.use(passport.initialize());
app.use(passport.session());

cron.schedule("*/5 * * * *", async () => {
  console.log("running a task every 5 minutes");
  await dailyPointsSystem();
});
app.use(Routes);
app.set("port", nconf.get("PORT") || 5001);
const port = app.get("port");
server.listen(port, () => console.log(`Server started on port ${port}`));
