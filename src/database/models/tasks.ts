import mongoose, { Schema } from "mongoose";
import { IOrganizationModel } from "./organization";

export type TaskTypes = "form" | "twitter_follow" | "gm" | "hold_nft";

export interface ITask {
  name: string;
  type: TaskTypes;
  instruction: string;
  points: number;
  organizationId: IOrganizationModel;
  twitterScreenName: string;
  contractAddress: string;
}

// task are things that you can do that gives you points
const task = new Schema(
  {
    name: String,
    type: {
      type: String,
      enum: ["form", "twitter_follow", "hold_nft", "gm"],
      required: true,
    },
    instruction: String,
    points: Number,
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    twitterScreenName: String,
    contractAddress: String,
  },
  {
    timestamps: true,
  }
);

export type ITaskModel = ITask & mongoose.Document;
export const Task = mongoose.model<ITaskModel>("Task", task);
