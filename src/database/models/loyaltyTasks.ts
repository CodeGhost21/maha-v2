// comes in from rupali's dashboard; this is the model where athe admin sets all the things that a user can do.

import mongoose, { Document, Schema } from "mongoose";
import { IOrganizationModel } from "./organisation";

export interface ILoyaltyTask {
  name: string;
  type: "form" | "twitter_follow" | "hold_nft" | "revoke_opensea" | "gm";
  instructions: string;
  weight: number;
  organizationId: IOrganizationModel;
}

// only added by org moderators
// loyalty tasks are things that you can do that will boost your points
// this helps us identify bots
const loyaltyTask = new Schema(
  {
    name: String,
    type: {
      type: String,
      enum: ["form", "twitter_follow", "hold_nft", "revoke_opensea", "gm"],
      required: true,
    },
    instructions: String,
    weight: Number, // 0-1  // validation every loyalty task for an org should add upto 1
    organizationId: {
      type: Schema.Types.ObjectId,
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
