import mongoose from "mongoose";

export interface IWalletUser {
  discordId: string;
  jwt: string;
  rank: number;
  referralCode: string;
  referredBy: string;
  totalPoints: number;
  twitterId: string;
  twitterOauthToken: string;
  twitterOauthTokenSecret: string;
  walletAddress: string;

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
    AAVEStaker: number;
    borrow: number;
    discordFollow: number;
    gm: number;
    liquidityONEZ: number;
    LQTYHolder: number;
    LUSDHolder: number;
    MAHAStaker: number;
    mintingONEZ: number;
    referral: number;
    supply: number;
    twitterFollow: number;
  };
}

const UserSchema = new mongoose.Schema(
  {
    discordId: String,
    jwt: String,
    rank: { type: Number },
    referralCode: { type: String },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    totalPoints: { type: Number, default: 0 },
    twitterId: String,
    twitterOauthToken: String,
    twitterOauthTokenSecret: String,
    walletAddress: { type: String },

    points: { type: Object, default: {} },
    checked: { type: Object, default: {} },
  },
  { timestamps: true }
);

export type IWalletUserModel = IWalletUser & mongoose.Document;
export const WalletUser = mongoose.model<IWalletUserModel>(
  "WalletUser",
  UserSchema
);
