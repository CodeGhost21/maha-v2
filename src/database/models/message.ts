import mongoose from "mongoose";

export interface IMessage {
  content: string;
  userTag: string;
  userID: string;
  dateTime: Date;
}

const schema = new mongoose.Schema(
  {
    content: String,
    userTag: String,
    userID: String,
    // userId: { type: Schema.Types.ObjectId, ref: "User" },
    dateTime: Date,
  },
  {
    timestamps: true,
  }
);

export type IMessageModel = IMessage & mongoose.Document;
export const Message = mongoose.model<IMessageModel>("Message", schema);
