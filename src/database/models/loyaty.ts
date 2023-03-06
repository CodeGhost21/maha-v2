import { Document, Schema } from "mongoose";
import mongoose from "mongoose";
import { IUser } from "./user";

export interface ILoyalty {
  userId: IUser;
  gm: boolean;
  twitterProfile: boolean;
  discordProfile: boolean;
  opensea: boolean;
  intro: boolean;
  totalLoyalty: number;
}

const loyaltySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    gm: { type: Boolean, default: false },
    twitterProfile: { type: Boolean, default: false },
    discordProfile: { type: Boolean, default: false },
    opensea: { type: Boolean, default: false },
    intro: { type: Boolean, default: false },
    totalLoyalty: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type ILoyaltyModel = ILoyalty & Document;
export const Loyalty = mongoose.model("Loyalty", loyaltySchema);
