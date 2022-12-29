require("dotenv").config();
const nconf = require("nconf");

nconf.argv().env().file({ file: "./config.json" });

process.env.ROOT_PATH = __dirname;

console.log("here", nconf.get("NODE_ENV") === "production");
if (
  nconf.get("NODE_ENV") === "production" ||
  process.env.NODE_ENV === "production"
) {
  require("./dist/index");
} else {
  console.log("else");
  require("./src/index");
}
