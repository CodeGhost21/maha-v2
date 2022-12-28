require('dotenv').config()
const nconf = require("nconf");


process.env.ROOT_PATH = __dirname;

console.log("here", process.env.NODE_ENV === "production")
if (nconf.get("NODE_ENV") === "production" || process.env.NODE_ENV === "production") {
  require("./dist/index");
} else {
  require("./src/index");
}
