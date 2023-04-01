import mongoose, { Schema } from "mongoose";
import { IOrganizationModel } from "./organization";

export type TaskTypes = "form" | "gm";

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
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["form", "gm"],
      required: true,
    },
    instruction: String,
    points: { type: Number, min: 0, default: 0 },
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
