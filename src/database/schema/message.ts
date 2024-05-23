import { Schema } from "mongoose";

export const message = new Schema({
  content: String,
  userTag: String,
  userID: String,
  dateTime: Date,
  url: String,
});
