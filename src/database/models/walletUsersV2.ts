import mongoose from "mongoose";
import { WalletUserSchema } from "../schema/walletUser";
import { IWalletUser } from "../interface/walletUser/walletUser";

export type IWalletUserModel = IWalletUser & mongoose.Document;
export const WalletUserV2 = mongoose.model<IWalletUserModel>(
  "WalletUserV2",
  WalletUserSchema
);
