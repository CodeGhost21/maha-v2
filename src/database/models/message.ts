import { Document, Schema, model } from "mongoose";

export interface IMessage {
  content: string;
  userTag: string;
  userID: string;
  dateTime: Date;
  url: string;
}

const message = new Schema({
  content: String,
  userTag: String,
  userID: String,
  dateTime: Date,
  url: String,
});

export type IMessageModel = IMessage & Document;
export const Message = model("Message", message);
