import dotenv from "dotenv";
import nconf from "nconf";
import path from "path";

dotenv.config();
nconf
  .argv()
  .env()
  .file({ file: path.resolve("./config.json") });

import { open } from "../database";
import { updateLPPointsHourly } from "src/cron/updateLPPointsHourly";

open();
updateLPPointsHourly();
