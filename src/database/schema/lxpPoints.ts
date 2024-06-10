import { Schema } from "mongoose";

export const LXPPointsSchema = new Schema(
  {
    walletAddress: { type: String, unique: true },
    xp: { type: Number, default:0 },
  },
  { timestamps: true }
);
