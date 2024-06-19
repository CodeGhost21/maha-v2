import { model } from "mongoose";
import { ICache } from "../interface/walletUser/cache";
import { CacheSchema } from "../schema/cache";

export type ICacheModel = ICache & Document;
export const CacheDB = model<ICacheModel>("CacheDB", CacheSchema);
