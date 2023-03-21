import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  content: string;
  userTag: string;
  userID: string;
  dateTime: Date;
}

const message = new Schema({
  content: String,
  userTag: String,
  userID: String,
  // userId: { type: Schema.Types.ObjectId, ref: "User" },
  dateTime: Date,
});

export type IMessageModel = IMessage & Document;
export const Message = mongoose.model<IMessageModel>("Message", message);
