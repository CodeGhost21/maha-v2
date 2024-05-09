import mongoose from "mongoose";
import { IUser } from "../interface/user/user";
import { UserSchema } from "../schema/walletUser";

export type IUserModel = IUser & mongoose.Document;
export const User = mongoose.model<IUserModel>("User", UserSchema);
