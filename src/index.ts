import * as http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import cron from "node-cron";
import express from "express";
import passport from "passport";
import session from "express-session";
import nconf from "nconf";

import * as database from "./database";

import "./bots/gm";
import "./strategies/discord";
import routes from "./routes";
import { dailyMahaXRewards } from "./controller/rewards";

database.open();

const app = express();
const server = new http.Server(app);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

cron.schedule("0 0 * * *", async () => {
  console.log("running a task every minute");
  dailyMahaXRewards();
});

app.use(
  session({
    secret: nconf.get("SESSION_SECRET") || "keyboard-cat",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.session());
app.use(routes);

app.use("/rewards", express.static("rewards"));

app.set("port", process.env.PORT || 5000);
const port = app.get("port");
server.listen(port, () => console.log(`Server started on port ${port}`));
