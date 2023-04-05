import mongoose, { Schema } from "mongoose";

import { IOrganizationModel } from "./organization";
import { IServerProfileModel } from "./serverProfile";
import { TaskTypes } from "./tasks";

export interface ITaskSubmission {
  name: string;
  type: TaskTypes;
  instructions: string;
  points: number;
  uri: string;
  isModeration: boolean;
  isApproved: "approved" | "rejected" | "pending";
  profileId: IServerProfileModel;
  approvedBy: IServerProfileModel; // moderator
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
    uri: String,
    isModeration: Boolean,

    profileId: {
      type: Schema.Types.ObjectId,
      ref: "ServerProfile",
      required: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "ServerProfile" }, // moderator
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    isApproved: { type: String, enum: ["approved", "rejected", "pending"] },
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
