import bodyParser from "body-parser";
import nconf from "nconf";
import express from "express";
import * as http from "http";
import cors from "cors";
import passport from "passport";
import session from "express-session";

import { open } from "./database";
import Routes from "./routes";
import "./strategies";
import "./bots/gm";
import "./cron";

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
app.use(Routes);
app.set("port", nconf.get("PORT") || 5002);
const port = app.get("port");
server.listen(port, () => console.log(`Server started on port ${port}`));
