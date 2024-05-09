import { Schema } from "mongoose";

export const UserPointTransactionsSchema = new Schema(
  {
    userId: { type: Schema.ObjectId, ref: "WalletUsers", required: true },
    previousPoints: { type: Number },
    currentPoints: { type: Number },
    subPoints: { type: Number },
    addPoints: { type: Number },
    message: { type: String },
  },
  { timestamps: true }
);
