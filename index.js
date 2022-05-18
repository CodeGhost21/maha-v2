import { config } from "dotenv";
import { get } from "nconf";

config();
process.env.ROOT_PATH = __dirname;

console.log("here", process.env.NODE_ENV === "production")
if (get("NODE_ENV") === "production" || process.env.NODE_ENV === "production") {
  require("./dist/index");
} else {
  require("./src/index");
}
