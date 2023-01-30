import mongoose from "mongoose";

export interface IUser {
  userTag: string;
  userID: string;
  streak: number;
  maxStreak: number;
  totalGMs: number;
  lastGM: Date;
  gmRank: number;
  jwt: string
  walletAddress: string
}

const UserSchema = new mongoose.Schema({
  userTag: String,
  userID: String,
  streak: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 },
  totalGMs: { type: Number, default: 0 },
  lastGM: Date,
  gmRank: { type: Number, default: 0 },
  jwt: String,
  walletAddress: { type: String, default: '' }
});

export type IUserModel = IUser & mongoose.Document;
export const User = mongoose.model("User", UserSchema);
