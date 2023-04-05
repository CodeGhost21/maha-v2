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
  isModeration: boolean;
  isTwitterRequired: boolean;
  isWalletRequired: boolean;
}

// task are things that you can do that gives you points
const task = new Schema(
  {
    name: { type: String, required: true },
    isTwitterRequired: { type: Boolean, default: false },
    isWalletRequired: { type: Boolean, default: false },
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
    isModeration: Boolean,
  },
  {
    timestamps: true,
  }
);

export type ITaskModel = ITask & mongoose.Document;
export const Task = mongoose.model<ITaskModel>("Task", task);
