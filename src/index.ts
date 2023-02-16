import bodyParser from "body-parser";
import express from "express";
import * as http from 'http'
const cors = require('cors')
import { twitterMetions } from './output/twitter';
import mahaLocks from "./bots/mahaLocks";
import routes from "./routes";
import "./bots/gm";
import "./bots/collabLand"

import { open } from "./database";

const app = express();
const server = new http.Server(app)
open();


twitterMetions()
// mahaxNFT();
// arth();
// mahalend()
mahaLocks();

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(routes)

app.set("port", process.env.PORT || 5000);
const port = app.get("port");
server.listen(port, () =>
    console.log(`Server started on port ${port}`)
);