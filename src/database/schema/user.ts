import { Schema } from "mongoose";

export const UserSchema = new Schema(
  {
    userTag: String,
    userID: { type: String, index: true },
    totalGMs: { type: Number, default: 0 },
    lastGM: Date,
    lastImage: Date,
    gmRank: { type: Number, default: 0 },
    jwt: String,
    discordName: { type: String, default: "" },
    discordDiscriminator: { type: String, default: "" },
    discordAvatar: { type: String, default: "" },
    walletAddress: { type: String },
    discordVerify: { type: Boolean, default: false },
    totalPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);
