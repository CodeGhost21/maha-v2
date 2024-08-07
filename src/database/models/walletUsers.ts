import mongoose from "mongoose";
import { WalletUserSchema } from "../schema/walletUser";
import { IWalletUser } from "../interface/walletUser/walletUser";

export type IWalletUserModel = IWalletUser & mongoose.Document;
export const WalletUser = mongoose.model<IWalletUserModel>(
  "WalletUser",
  WalletUserSchema
);
