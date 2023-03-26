// a submission made by a user performign a loyalty task; similar to pointTransaction

// user -> loyaltySubmissions = one-to-many

import mongoose, { Document, Schema } from "mongoose";
import { IUserModel } from "./user";
import { IOrganizationModel } from "./organization";
import { LoyaltyTaskType } from "./loyaltyTasks";

export interface ILoyaltySubmission {
  name: string;
  type: LoyaltyTaskType;
  totalWeight: number;
  instructions: string;

  profile: IUserModel;
  approvedBy: IUserModel;
  organizationId: IOrganizationModel;
}

const loyaltySubmission = new Schema(
  {
    name: String,
    type: {
      type: String,
      enum: ["twitter_profile", "discord_profile", "revoke_opensea", "gm"],
      required: true,
    },
    totalWeight: Number,
    instructions: String,

    approvedBy: { type: Schema.Types.ObjectId, ref: "ServerProfile" },
    profile: { type: Schema.Types.ObjectId, ref: "ServerProfile" },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  },
  { timestamps: true }
);

export type ILoyaltySubmissionModel = ILoyaltySubmission & Document;
export const LoyaltySubmission = mongoose.model<ILoyaltySubmissionModel>(
  "LoyaltySubmission",
  loyaltySubmission
);
