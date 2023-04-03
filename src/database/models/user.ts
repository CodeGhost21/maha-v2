import mongoose from "mongoose";

export interface IUser {
  discordVerify: string;
  discordName: string;
  discordId: string;
  discordTag: string;
  discordDiscriminator: string;
  discordAvatar: string;

  discordOauthAccessToken: string;
  discordOauthAccessTokenExpiry: Date;
  discordOauthRefreshToken: string;

  twitterID: string;
  twitterName: string;
  twitterScreenName: string;
  twitterBio: string;
  twitterProfileImg: string;
  twitterBanner: string;

  twitterOauthAccessToken: string;
  twitterOauthAccessTokenSecret: string;
  twitterRequestToken: string;
  twitterRequestTokenSecret: string;

  walletAddress: string;
  walletSignature: string;
}

const schema = new mongoose.Schema(
  {
    discordVerify: String,
    discordName: String,
    discordId: String,
    discordTag: String,
    discordDiscriminator: String,
    discordAvatar: String,

    discordOauthAccessToken: String,
    discordOauthAccessTokenSecret: String,
    discordOauthAccessTokenExpiry: Date,

    twitterID: String,
    twitterName: String,
    twitterScreenName: String,
    twitterBio: String,
    twitterProfileImg: String,
    twitterBanner: String,

    twitterOauthAccessToken: String,
    twitterOauthAccessTokenSecret: String,
    twitterRequestTokenSecret: String,
    twitterRequestToken: String,

    walletAddress: String,
    walletSignature: String,
  },
  {
    timestamps: true,
  }
);

export type IUserModel = IUser & mongoose.Document;
export const User = mongoose.model<IUserModel>("User", schema);
