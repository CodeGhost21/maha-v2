import mongoose from "mongoose";

export interface IWalletUser {
  discordId: string;
  jwt: string;
  walletAddress: string;
  discordFollow: boolean;
  discordVerify: boolean;
  twitterFollow: boolean;
  twitterVerify: boolean;
  totalPoints: number;
  rank: number;
}

const UserSchema = new mongoose.Schema(
  {
    discordId: String,
    jwt: String,
    walletAddress: { type: String },
    discordFollow: { type: Boolean, default: false },
    discordVerify: { type: Boolean, default: false },
    twitterFollow: { type: Boolean, default: false },
    twitterVerify: { type: Boolean, default: false },
    totalPoints: { type: Number, default: 0 },
    rank: { type: Number },
  },
  { timestamps: true }
);

export type IWalletUserModel = IWalletUser & mongoose.Document;
export const WalletUser = mongoose.model<IWalletUserModel>(
  "WalletUser",
  UserSchema
);
