import { Document, Schema } from "mongoose";
import mongoose from "mongoose";
import { IUser } from "./user";

export interface IFeed {
  userId: IUser;
  type: "normal" | "loyalty";
  task: string;
  points: number;
}

const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["normal", "loyalty"], required: true },
    task: { type: String, required: true },
    points: { type: Number, default: 0, required: true },
  },
  { timestamps: true }
);

export type IFeedModel = IFeed & Document;
export const Feed = mongoose.model<IFeed>("Feed", schema);
