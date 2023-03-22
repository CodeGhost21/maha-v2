import mongoose, { Schema, ObjectId } from "mongoose";
import { IUserModel } from "./user";
import { IOrganizationModel } from "./organisation";

export interface ITask {
  name: string;
  type: "form" | "retweet" | "gm";
  instructions: string;
  points: number;
  approvedBy: IUserModel; // moderator
  organizationId: IOrganizationModel;
}

// task are things that you can do that gives you points
const task = new Schema({
  name: String,
  type: {
    type: String,
    enum: ["form", "twitter_follow", "hold_nft", "revoke_opensea", "gm"],
    required: true,
  },
  instructions: String,
  points: Number,
  // approvedBy: { type: Schema.Types.ObjectId, ref: "User" }, // moderator
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
});

export type ITaskModel = ITask & mongoose.Document;
export const Task = mongoose.model<ITaskModel>("Task", task);
