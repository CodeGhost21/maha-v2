import mongoose from "mongoose";
import { ICartModel } from "./cart";
import { ILoyaltyModel } from "./loyaty";

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

  getLoyalty: () => Promise<ILoyaltyModel>;
  getCart: () => Promise<ICartModel>;
}

const UserSchema = new mongoose.Schema(
  {
    userTag: String,
    userID: String,
    twitterID: String,
    twitterName: String,
    twitterBio: String,
    twitterProfileImg: String,
    twitterBanner: String,
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
    twitterOauthAccessTokenSecret: { type: String },

    discordOauthAccessToken: { type: String },
    discordOauthAccessTokenSecret: { type: String },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.getLoyalty = function () {
  return this.name + "TROLOLO";
};

export type IUserModel = IUser & mongoose.Document;
export const User = mongoose.model<IUserModel>("User", UserSchema);
