import bodyParser from "body-parser";
import express from "express";
import * as http from "http";
import cors from "cors";
import passport from "passport";
import session from "express-session";

import { open } from "./database";

// import "./bots/collabLand.ts.dis";
import "./bots/gm";
import "./strategies/discord";
import { twitterMetions } from "./output/twitter";
import mahaLocks from "./bots/mahaLocks";
import routes from "./routes";

const app = express();
const server = new http.Server(app);

open();
twitterMetions();
// mahaxNFT();
// arth();
// mahalend()
mahaLocks();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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
