import mongoose from "mongoose";

export interface IUser {
  isModerator: boolean;

  twitterID: string;
  twitterName: string;
  twitterScreenName: string;
  twitterBio: string;
  twitterProfileImg: string;
  twitterBanner: string;

  walletAddress: string;

  discordVerify: string;
  discordName: string;
  discordId: string;
  discordTag: string;
  discordDiscriminator: string;
  discordAvatar: string;

  discordOauthAccessToken: string;
  discordOauthAccessTokenExpiry: Date;
  discordOauthRefreshToken: string;

  twitterOauthAccessToken: string;
  twitterOauthAccessTokenSecret: string;
  twitterRequestToken: string;
  twitterRequestTokenSecret: string;
}

const schema = new mongoose.Schema(
  {
    twitterID: String,
    twitterName: String,
    twitterScreenName: String,
    twitterBio: String,
    twitterProfileImg: String,
    twitterBanner: String,

    walletAddress: String,

    discordVerify: String,
    discordName: String,
    discordId: String,
    discordTag: String,
    discordDiscriminator: String,
    discordAvatar: String,

    twitterOauthAccessToken: String,
    twitterOauthAccessTokenSecret: String,
    twitterRequestTokenSecret: String,
    twitterRequestToken: String,

    discordOauthAccessToken: String,
    discordOauthAccessTokenSecret: String,
    discordOauthAccessTokenExpiry: Date,
  },
  {
    timestamps: true,
  }
);

export type IUserModel = IUser & mongoose.Document;
export const User = mongoose.model<IUserModel>("User", schema);
