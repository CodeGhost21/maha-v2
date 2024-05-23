import { Schema } from "mongoose";

export const BlastUserSchema = new Schema(
  {
    walletAddress: { type: String, index: true },
    blastPoints: { type: Object, default: {} },
    blastGold: { type: Object, default: {} },
  },
  { timestamps: true }
);
