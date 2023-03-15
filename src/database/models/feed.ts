import { Document, Schema } from "mongoose";
import mongoose from "mongoose";
import { IUser } from "./user";

export interface IFeed {
  userId: IUser;
  type: "normal" | "loyalty";
  task: string;
  points: number;
}

const feedSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["normal", "loyalty"] },
    task: { type: String, default: "" },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type IFeedModel = IFeed & Document;
export const Feed = mongoose.model("Feed", feedSchema);
