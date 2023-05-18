import mongoose from "mongoose";

export interface IMessage {
  content: string;
  userTag: string;
  userID: string;
  dateTime: Date;
}

const message = new mongoose.Schema({
  content: String,
  userTag: String,
  userID: String,
  dateTime: Date,
});

export type IMessageModel = IMessage & mongoose.Document;
export const Message = mongoose.model("Message", message);
