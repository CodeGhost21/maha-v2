import { Schema } from "mongoose";
import { IWalletUserPoints } from "../interface/walletUser/walletUserPoints";

export const WalletUserSchema = new Schema(
  {
    discordId: { type: String, index: true },
    // jwt: String,
    rank: { type: Number, index: true },
    referralCode: { type: [String], index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "Users" },
    referrerCode: { type: String },
    totalPoints: { type: Number, default: 0, index: true },
    totalSupplyPoints: { type: Number, default: 0, index: true },
    totalBorrowPoints: { type: Number, default: 0, index: true },
    totalStakePoints: { type: Number, default: 0, index: true },
    walletAddress: { type: String, unique: true, index: true },
    role: { type: String },
    epoch: { type: Number },
    points: { type: {} as IWalletUserPoints, default: {} },
    // pointsUpdateTimestamp: { type: Object, default: {} },
    pointsPerSecond: {
      type: {} as IWalletUserPoints,
      index: true,
      default: {},
    },
    pointsUpdateTimestamp: {
      type: {} as IWalletUserPoints,
      index: true,
      default: {},
    },
    epochs: { type: {} as IWalletUserPoints },
    boostStake: { type: Number, default: 1, index: true },
  },
  { timestamps: true }
);
