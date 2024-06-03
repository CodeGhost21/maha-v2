import { Schema } from "mongoose";
import { IWalletUserPoints } from "../interface/walletUser/walletUserPoints";

export const WalletUserSchemaV2 = new Schema(
  {
    discordId: { type: String, index: true },
    jwt: String,
    rank: { type: Number, index: true },
    referralCode: { type: [String], index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "Users" },
    totalPoints: { type: Number, default: 0, index: true },
    walletAddress: { type: String, unique: true, index: true },
    role: { type: String },
    epoch: { type: Number, default: 0 },
    points: { type: {} as IWalletUserPoints, default: {} },
    // pointsUpdateTimestamp: { type: Object, default: {} },
    pointsPerSecond: { type: {} as IWalletUserPoints, default: {} },
    pointsPerSecondUpdateTimestamp: { type: {} as IWalletUserPoints, default: {} },
    epochs: { type: {} as IWalletUserPoints, default: {} },
  },
  { timestamps: true }
);
