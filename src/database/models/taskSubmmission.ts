import mongoose, { Schema } from "mongoose";
import { IUserModel } from "./user";
import { IOrganizationModel } from "./organisation";

export interface ITaskSubmission {
  name: string;
  type: string;
  instructions: string;
  points: number;
  approvedBy: IUserModel; // moderator
  organizationId: IOrganizationModel;
}

// task are things that you can do that gives you points
const taskSubmissionSchema = new mongoose.Schema(
  {
    name: String,
    type: {
      type: String,
      enum: ["form", "twitter_follow", "hold_nft", "revoke_opensea", "gm"],
      required: true,
    },
    instructions: String,
    points: Number,
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" }, // moderator
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  },
  {
    timestamps: true,
  }
);

export type ITaskSubmissionModel = ITaskSubmission & mongoose.Document;
export const TaskSubmission = mongoose.model<ITaskSubmissionModel>(
  "TaskSubmission",
  taskSubmissionSchema
);
