import mongoose from "mongoose";

export interface IWalletUser {
  discordId: string;
  twitterId: string;
  jwt: string;
  rank: number;
  walletAddress: string;
  totalPoints: number;
  referralCode: string;
  referredBy: string;
  twitterOauthToken: string;
  twitterOauthTokenSecret: string;

  checked: {
    gm: boolean;
    AAVEStaker: boolean;
    LQTYHolder: boolean;
    LUSDHolder: boolean;
    MAHAStaker: boolean;
    AAVEStakers: boolean;
    discordFollow: boolean;
    discordVerify: boolean;
    twitterVerify: boolean;
    twitterFollow: boolean;
  };

  points: {
    gm: number;
    mintingONEZ: number;
    liquidityONEZ: number;
    discordFollow: number;
    twitterFollow: number;
    LQTYHolder: number;
    LUSDHolder: number;
    AAVEStaker: number;
    MAHAStaker: number;
    supply: number;
    borrow: number;
    referral: number;
  };
}

const UserSchema = new mongoose.Schema(
  {
    discordId: String,
    twitterId: String,
    jwt: String,
    walletAddress: { type: String },
    discordFollowChecked: { type: Boolean, default: false },
    discordVerify: { type: Boolean, default: false },
    twitterFollowChecked: { type: Boolean, default: false },
    twitterVerify: { type: Boolean, default: false },
    twitterOauthToken: String,
    twitterOauthTokenSecret: String,
    totalPoints: { type: Number, default: 0 },
    referralCode: { type: String },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    rank: { type: Number },
    gmChecked: { type: Boolean, default: false },
    AAVEStakerChecked: { type: Boolean, default: false },
    MAHAStaker: { type: Boolean, default: false },
    LQTYHolderChecked: { type: Boolean, default: false },
    LUSDHolderChecked: { type: Boolean, default: false },
    MAHAStakerChecked: { type: Boolean, default: false },

    gmPoints: { type: Number, default: 0 },
    mintingONEZPoints: { type: Number, default: 0 },
    liquidityONEZPoints: { type: Number, default: 0 },
    discordFollowPoints: { type: Number, default: 0 },
    twitterFollowPoints: { type: Number, default: 0 },
    MAHAStakerPoints: { type: Number, default: 0 },
    LQTYHolderPoints: { type: Number, default: 0 },
    LUSDHolderPoints: { type: Number, default: 0 },
    AAVEStakerPoints: { type: Number, default: 0 },
    supplyPoints: { type: Number, default: 0 },
    borrowPoints: { type: Number, default: 0 },
    referralPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type IWalletUserModel = IWalletUser & mongoose.Document;
export const WalletUser = mongoose.model<IWalletUserModel>(
  "WalletUser",
  UserSchema
);
