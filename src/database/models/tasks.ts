import mongoose, { Schema } from "mongoose";
import { IOrganizationModel } from "./organisation";

export interface ITask {
  name: string;
  type: "form" | "retweet" | "gm";
  instruction: string;
  points: number;
  organizationId: IOrganizationModel;
}

// task are things that you can do that gives you points
const task = new Schema(
  {
    name: String,
    type: {
      type: String,
      enum: ["form", "twitter_follow", "hold_nft", "revoke_opensea", "gm"],
      required: true,
    },
    instruction: String,
    points: Number,
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  },
  {
    timestamps: true,
  }
);

export type ITaskModel = ITask & mongoose.Document;
export const Task = mongoose.model<ITaskModel>("Task", task);
