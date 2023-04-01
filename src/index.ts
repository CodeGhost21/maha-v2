import * as http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import session from "express-session";
import nconf from "nconf";

import * as database from "./database";

import "./bots/discord";
import routes from "./routes";
import * as cron from "./cron";
import HttpError from "./errors/HttpError";

database.open();
cron.init();

const app = express();
const server = new http.Server(app);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    secret: nconf.get("SESSION_SECRET") || "keyboard-cat",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(routes);

app.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500);
    // @ts-ignore
    res.json({ error: err.message || err.data, success: false });
  }
);

const port = nconf.get("PORT") || 5000;
app.set("port", port);
server.listen(port, () => console.log(`Server started on port ${port}`));
