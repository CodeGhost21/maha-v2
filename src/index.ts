import { open } from "./database";
import * as http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import nconf from "nconf";
import passport from "passport";
import routes from "./routes";
import session from "express-session";
import "./strategies";
import './bot/gm'

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