import mongoose, { Schema } from "mongoose";

export interface IMessage {
  content: string;
  userTag: string;
  userID: string;
  dateTime: Date;
}

const schema = new Schema(
  {
    content: String,
    userTag: String,
    userID: String,
    // userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateTime: Date,
  },
  {
    timestamps: true,
  }
);

export type IMessageModel = IMessage & mongoose.Document;
export const Message = mongoose.model<IMessageModel>("Message", schema);
