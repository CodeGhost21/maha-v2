import mongoose from "mongoose";

export const UserSchemaLegacy = new mongoose.Schema(
  {
    discordId: { type: String, index: true },
    jwt: String,
    rank: { type: Number, index: true },
    referralCode: { type: String, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    totalPointsV2: { type: Number, default: 0, index: true },
    claimedTotalPointsV2: { type: Number, default: 0, index: true },
    totalPoints: { type: Number, default: 0 },
    twitterId: String,
    twitterOauthToken: String,
    twitterOauthTokenSecret: String,
    walletAddress: { type: String, index: true },
    role: { type: String },

    epoch: { type: Number, default: 0 },
    points: { type: Object, default: {} },
    checked: { type: Object, default: {} },
    epochs: { type: Object, default: {} },
    pointsUpdateTimestamp: { type: Object, default: {} },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);
