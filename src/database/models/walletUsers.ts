import mongoose from "mongoose";

export interface IWalletUserChecked {
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
  PythStaker: boolean;
  MantaStaker: boolean;
  HoldStationStaker: boolean;
}

export interface IWalletUserPoints {
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
  supplyBlast: number;
  borrowBlast: number;
  twitterFollow: number;
  PythStaker: number;
  MantaStaker: number;
  HoldStationStaker: number;
  // total: number;
}

export interface IWalletUser {
  discordId: string;
  jwt: string;
  rank: number;
  referralCode: string;
  referredBy: string;
  totalPointsV2: number;
  twitterId: string;
  twitterOauthToken: string;
  twitterOauthTokenSecret: string;
  walletAddress: string;
  role: string;
  epoch: number;

  checked: IWalletUserChecked;
  points: IWalletUserPoints;
  pointsUpdateTimestamp: IWalletUserPoints;
}

const UserSchema = new mongoose.Schema(
  {
    discordId: { type: String, index: true },
    jwt: String,
    rank: { type: Number, index: true },
    referralCode: { type: String, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    totalPointsV2: { type: Number, default: 0, index: true },
    totalPoints: { type: Number, default: 0 },
    twitterId: String,
    twitterOauthToken: String,
    twitterOauthTokenSecret: String,
    walletAddress: { type: String, index: true },
    role: { type: String },

    epoch: { type: Number, default: 0 },
    points: { type: Object, default: {} },
    checked: { type: Object, default: {} },
    pointsUpdateTimestamp: { type: Object, default: {} },
  },
  { timestamps: true }
);

export type IWalletUserModel = IWalletUser & mongoose.Document;
export const WalletUser = mongoose.model<IWalletUserModel>(
  "WalletUser",
  UserSchema
);
