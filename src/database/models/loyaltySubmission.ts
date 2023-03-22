// a submission made by a user performign a loyalty task; similar to pointTransaction

// user -> loyaltySubmissions = one-to-many

import mongoose, { Document, Schema } from "mongoose";
import { IUser, IUserModel } from "./user";
import { ILoyaltyTaskModel } from "./loyaltyTasks";
import { IOrganizationModel } from "./organisation";

export interface ILoyaltySubmission {
  type: string;
  totalWeight: number;
  instructions: string;
  approvedBy: IUserModel;
  organizationId: IOrganizationModel;
}

const loyaltySubmission = new Schema(
  {
    type: { type: String, default: "" },
    totalWeight: Number,
    instructions: String,
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  },
  { timestamps: true }
);

export type ILoyaltySubmissionModel = ILoyaltySubmission & Document;
export const LoyaltySubmission = mongoose.model<ILoyaltySubmissionModel>(
  "LoyaltySubmission",
  loyaltySubmission
);
