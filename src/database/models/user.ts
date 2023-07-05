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
  zelayUserId: string;
  zelayUserName: string;
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

    zelayUserId: { type: String, default: "" },
    zelayUserName: { type: String, default: "" },
  },
  { timestamps: true }
);

export type IUserModel = IUser & mongoose.Document;
export const User = mongoose.model<IUserModel>("User", UserSchema);
