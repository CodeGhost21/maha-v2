import mongoose from "mongoose";
import { WalletUserSchemaV2 } from "../schema/walletUserV2";
import { IWalletUser } from "../interface/walletUser/walletUser";

export type IWalletUserModel = IWalletUser & mongoose.Document;
export const WalletUserV2 = mongoose.model<IWalletUserModel>(
  "WalletUserV2",
  WalletUserSchemaV2
);
