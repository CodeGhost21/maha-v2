// a submission made by a user performign a loyalty task; similar to pointTransaction

// user -> loyaltySubmissions = one-to-many

import mongoose, { Document, Schema } from "mongoose";
import { IServerProfileModel } from "./serverProfile";
import { IOrganizationModel } from "./organization";
import { LoyaltyTaskType } from "./loyaltyTasks";

export interface ILoyaltySubmission {
  name: string;
  type: LoyaltyTaskType;

  taskWeight: number;

  oldProfileLoyalty: number;
  newProfileLoyalty: number;

  profileId: IServerProfileModel;
  approvedBy: IServerProfileModel;
  organizationId: IOrganizationModel;
}

const loyaltySubmission = new Schema(
  {
    name: String,
    type: {
      type: String,
      enum: ["twitter_pfp", "hold_nft", "discord_pfp", "revoke_opensea", "gm"],
      required: true,
    },

    taskWeight: Number,
    oldProfileLoyalty: Number,
    newProfileLoyalty: Number,

    approvedBy: { type: Schema.Types.ObjectId, ref: "ServerProfile" },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: "ServerProfile",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
  },
  { timestamps: true }
);

export type ILoyaltySubmissionModel = ILoyaltySubmission & Document;
export const LoyaltySubmission = mongoose.model<ILoyaltySubmissionModel>(
  "LoyaltySubmission",
  loyaltySubmission
);
