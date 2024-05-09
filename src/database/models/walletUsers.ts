import mongoose from "mongoose";
import { UserSchema } from "../schema/walletUser";
import { IWalletUser } from "../interface/walletUser/walletUser";

export type IWalletUserModel = IWalletUser & mongoose.Document;
export const WalletUser = mongoose.model<IWalletUserModel>(
  "WalletUser",
  UserSchema
);
