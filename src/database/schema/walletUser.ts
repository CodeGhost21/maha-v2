import { Schema } from "mongoose";

export const UserSchema = new Schema(
  {
    discordId: { type: String, index: true },
    jwt: String,
    rank: { type: Number, index: true },
    referralCode: { type: Array, index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "Users" },
    totalPointsV2: { type: Number, default: 0, index: true },
    claimedTotalPointsV2: { type: Number, default: 0, index: true },
    twitterId: String,
    twitterOauthToken: String,
    twitterOauthTokenSecret: String,
    walletAddress: { type: String, index: true, unique: true },
    role: { type: String },
    epoch: { type: Number, default: 0 },
    pointsV2: { type: Object, default: {} },
    epochs: { type: Object, default: {} },
    pointsUpdateTimestamp: { type: Object, default: {} },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);
