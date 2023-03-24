import mongoose, { Document, Schema } from "mongoose";
import { IUserModel } from "./user";

export interface IFeed {
  userId: IUserModel;
  type: "task" | "loyalty";
  task: string;
  points: number;
}

const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["task", "loyalty"], required: true },
    task: { type: String, required: true },
    points: { type: Number, default: 0, required: true },
  },
  { timestamps: true }
);

export type IFeedModel = IFeed & Document;
export const Feed = mongoose.model<IFeed>("Feed", schema);
