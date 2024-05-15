import mongoose from "mongoose";
import { IWalletUser } from "../interface/walletUser/walletUser";
import { WalletUserSchemaV2 } from "../schema/walletUserV2";

export type IWalletUserModel = IWalletUser & mongoose.Document;
export const WalletUser = mongoose.model<IWalletUserModel>(
  "WalletUser",
  WalletUserSchemaV2
);
