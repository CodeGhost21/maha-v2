import mongoose from "mongoose";

export interface IUser {
  userTag: string;
  userID: string;
  twitterID: string;
  twitterName: string;
  twitterBio: string;
  twitterProfileImg: string;
  twitterBanner: string;
  signTwitter: boolean;
  streak: number;
  maxStreak: number;
  totalGMs: number;
  lastGM: Date;
  gmRank: number;
  walletAddress: string;
  discordVerify: boolean;
  discordName: string;
  discordDiscriminator: string;

  discordOauthAccessToken: string;
  discordOauthRefreshToken: string;

  discordAvatar: string;
  signDiscord: boolean;
  totalPoints: number;
  stakedMaha: boolean;
  twitterOauthAccessToken: string;
  twitterOauthAccessTokenSecret: string;
}

const UserSchema = new mongoose.Schema(
  {
    userTag: String,
    userID: String,
    twitterID: { type: String, default: "" },
    twitterName: { type: String, default: "" },
    twitterBio: { type: String, default: "" },
    twitterProfileImg: { type: String, default: "" },
    twitterBanner: { type: String, default: "" },
    signTwitter: { type: Boolean, default: false },
    streak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    totalGMs: { type: Number, default: 0 },
    lastGM: Date,
    gmRank: { type: Number, default: 0 },
    walletAddress: { type: String, default: "" },
    discordVerify: { type: Boolean, default: false },
    discordName: { type: String, default: "" },
    discordDiscriminator: { type: String, default: "" },
    discordAvatar: { type: String, default: "" },
    signDiscord: { type: Boolean, default: false },
    totalPoints: { type: Number, default: 0 },
    stakedMaha: { type: Boolean, default: false },

    twitterOauthAccessToken: { type: String },
    discordOauthRefreshToken: { type: String },

    discordOauthAccessToken: { type: String },
    discordOauthAccessTokenSecret: { type: String },
  },
  { timestamps: true }
);

export type IUserModel = IUser & mongoose.Document;
export const User = mongoose.model<IUserModel>("User", UserSchema);
