import mongoose from "mongoose";

export interface IUser {
  userTag: string;
  userID: string;
  streak: number;
  maxStreak: number;
  totalGMs: number;
  lastGM: Date;
  lastImage: Date;
  gmRank: number;
  jwt: string;
  discordName: string;
  discordDiscriminator: string;
  discordAvatar: string;
  walletAddress: string;
  discordVerify: boolean;
  twitterVerify: boolean;
  totalPoints: number;
}

const UserSchema = new mongoose.Schema(
  {
    userTag: String,
    userID: String,
    streak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
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
    twitterVerify: { type: Boolean, default: false },
    totalPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type IUserModel = IUser & mongoose.Document;
export const User = mongoose.model<IUserModel>("User", UserSchema);
