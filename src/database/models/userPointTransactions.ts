import { Document, model } from "mongoose";
import { IUserPointTransactions } from "../interface/userPoints/userPointsTransactions";
import { UserPointTransactionsSchema } from "../schema/pointTransactions";

export type IUserPointTransactionsModel = IUserPointTransactions & Document;
export const UserPointTransactions = model<IUserPointTransactionsModel>(
  "UserPointTransactions",
  UserPointTransactionsSchema
);
