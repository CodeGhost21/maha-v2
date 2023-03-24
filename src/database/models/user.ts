import mongoose, { Schema } from "mongoose";
import { Cart, ICartModel } from "./cart";
// import { ILoyaltyModel, Loyalty } from "./loyaltySubmission";
import { IOrganization } from "./organisation";

export interface IUser {
  userTag: string;
  userID: string;
  organizationId: IOrganization;
  isModerator: boolean;
  twitterID: string;
  twitterName: string;
  twitterScreenName: string;
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
  discordOauthAccessTokenExpiry: Date;
  discordOauthRefreshToken: string;

  discordAvatar: string;
  signDiscord: boolean;
  totalPoints: number;
  loyaltyWeight: number;
  stakedMaha: boolean;

  twitterOauthAccessToken: string;
  twitterOauthAccessTokenSecret: string;
  twitterRequestToken: string;
  twitterRequestTokenSecret: string;

  // getLoyalty: () => Promise<ILoyaltyModel>;
  getCart: () => Promise<ICartModel>;
}

const schema = new mongoose.Schema(
  {
    userTag: String,
    userID: String,
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },
    isModerator: { type: Boolean, default: false },
    twitterID: String,
    twitterName: String,
    twitterScreenName: String,
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
    // adding a point => totalPoints += points * ((maxBoost * loyalty) + 1)
    // eg: MaxBoost = 5; loyalty = 0%; points = 100
    // ---> totalPoints += 100 * (2.5 + 1) => 100 * 3.5 => 350
    totalPoints: { type: Number, default: 0 },

    // this gets recalculated every time a user performs a loyalty task
    loyaltyWeight: { type: Number, default: 0 }, // 0-1
    stakedMaha: { type: Boolean, default: false },

    twitterOauthAccessToken: String,
    twitterOauthAccessTokenSecret: String,
    twitterRequestTokenSecret: String,
    twitterRequestToken: String,

    discordOauthAccessToken: { type: String },
    discordOauthAccessTokenSecret: { type: String },
    discordOauthAccessTokenExpiry: Date,
  },
  {
    timestamps: true,
  }
);

// UserSchema.methods.getLoyalty = async function () {
//   const found = await Loyalty.findOne({ userId: this.id });
//   if (found) return found;
//   return Loyalty.create({ userId: this.id });
// };

schema.methods.getCart = async function () {
  const found = await Cart.findOne({ userId: this.id });
  if (found) return found;
  return Cart.create({ userId: this.id });
};

export type IUserModel = IUser & mongoose.Document;
export const User = mongoose.model<IUserModel>("User", schema);
