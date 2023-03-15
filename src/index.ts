import bodyParser from "body-parser";
import express from "express";
import * as http from "http";
import cors from "cors";
import passport from "passport";
import session from "express-session";
const cron = require("node-cron");

import { open } from "./database";

import "./bots/gm";
import "./strategies/discord";
// import { twitterMetions } from "./output/twitter";
// import mahaLocks from "./bots/mahaLocks";
import routes from "./routes";
import { nftTransfer, dailyMahaXRewards } from "./controller/rewards";
//
const app = express();
const server = new http.Server(app);

open();
// twitterMetions();
// mahaxNFT();
// arth();
// mahalend()
// mahaLocks();
nftTransfer();
// test(
//   "https://pbs.twimg.com/profile_images/1635575535391866881/Cf6S6PXS_normal.jpg",
//   "https://cdn.peopleofeden.com/generation/614/0/226e6d944506785b2ac939bbb5cc2e8f.png"
// );

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

cron.schedule("0 0 * * *", async () => {
  console.log("running a task every minute");
  dailyMahaXRewards();
});

app.use(
  session({
    secret: "keyboard cat",
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
