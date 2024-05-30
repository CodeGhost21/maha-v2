import { open } from "./database";
import { updateLBCache } from "./cron/updateLBCache";
import { totalUsers } from "./cron/totalUser";
import * as http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import cron from "node-cron";
import express from "express";
import nconf from "nconf";
import passport from "passport";
import routes from "./routes";
import session from "express-session";
import { totalPoints } from "./cron/totalPoints";
import "./strategies";
import { blastPPSCron, lineaPPSCron } from "./cron/dailyLpPointsChain.v2";
import { updateLPPointsHourly } from "./cron/lpPointshourly";

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
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(routes);
app.set("port", nconf.get("PORT") || 5002);

const port = app.get("port");
server.listen(port, () => console.log(`server started on port ${port}`));

// // setup LB cache
cron.schedule("*/10 * * * *", async () => {
  console.log("updating leaderboard cache 10 minutes");
  await updateLBCache();
  await totalUsers();
});

cron.schedule("0 * * * *", async () => {
  console.log("updating totalPoints every hour");
  await totalPoints();
});

// totalPoints();
// updateLBCache();
updateLPPointsHourly();