// comes in from rupali's dashboard; this is the model where athe admin sets all the things that a user can do.

import mongoose, { Document, Schema } from "mongoose";
import { IOrganizationModel } from "./organization";
import { IUserModel } from "./user";

export interface ILoyaltyTask {
  name: string;
  type: "twitter_profile" | "discord_profile" | "revoke_opensea" | "gm";
  instruction: string;
  weight: number;
  needsModeration: boolean;
  createdBy: IUserModel;
  organizationId: IOrganizationModel;
}

// only added by org moderators
// loyalty tasks are things that you can do that will boost your points
// this helps us identify bots
const loyaltyTask = new Schema(
  {
    name: { type: String, required: true },
    instruction: { type: String, required: true },
    needsModeration: { type: Boolean, required: true, default: false },
    type: {
      type: String,
      enum: ["twitter_profile", "discord_profile", "revoke_opensea", "gm"],
      required: true,
    },
    weight: { type: Number, min: 0, max: 0, required: true }, // 0-1  // validation every loyalty task for an org should add upto 1
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Organization",
    },
  },
  { timestamps: true }
);

export type ILoyaltyTaskModel = ILoyaltyTask & Document;
export const LoyaltyTask = mongoose.model<ILoyaltyTaskModel>(
  "LoyaltyTasks",
  loyaltyTask
);
