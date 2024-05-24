import mongoose from "mongoose";
import { IWalletUserLegacy } from "../interface/walletUser/walletUserLegacy";
import { UserSchemaLegacy } from "../schema/walletUser";

export type IWalletUserModel = IWalletUserLegacy & mongoose.Document;
export const WalletUser = mongoose.model<IWalletUserModel>("WalletUser", UserSchemaLegacy);
