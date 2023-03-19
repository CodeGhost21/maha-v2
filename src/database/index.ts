import mongoose from "mongoose";
import nconf from "nconf";

mongoose.set("strictQuery", false);
mongoose.set("debug", nconf.get("NODE_ENV") === "development");

export const open = () => {
  return new Promise<void>((resolve, reject) => {
    // Setup cache for mongoose
    // cachegoose(mongoose)
    console.log("opening mongodb connection");
    mongoose.connect(nconf.get("DATABASE_URI"), (error) => {
      if (error) {
        console.log(error);
        return reject(error);
      } else {
        console.log("Mongo Connected");
        resolve();
      }
    });
  });
};

export const close = () => mongoose.disconnect();
