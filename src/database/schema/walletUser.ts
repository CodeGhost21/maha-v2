import { Schema } from "mongoose";

export const UserSchema = new Schema(
  {
    discordId: { type: String, index: true },
    jwt: String,
    rank: { type: Number, index: true },
    referralCode: { type: Array, index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "Users" },
    totalPoints: { type: Number, default: 0, index: true },
    walletAddress: { type: String, index: true, unique: true },
    role: { type: String },
    epoch: { type: Number, default: 0 },
    points: { type: Object, default: {} },
    pointsUpdateTimestamp: { type: Object, default: {} },
    pointsPerSecond: { type: Object, default: {} },
    pointsPerSecondUpdateTimestamp: { type: Object, default: {} },
    epochs: { type: Object, default: {} },
  },
  { timestamps: true }
);
