import { Document, model, Schema } from "mongoose";
import { IWalletUserModel } from "./walletUsers";

export interface IUserPointTransactions {
  userId: IWalletUserModel;
  previousPoints: number;
  currentPoints: number;
  subPoints: number;
  addPoints: number;
  message: string;
}

const UserPointTransactionsSchema = new Schema(
  {
    userId: { type: Schema.ObjectId, ref: "WalletUsers", required: true },
    previousPoints: { type: Number },
    currentPoints: { type: Number },
    subPoints: { type: Number },
    addPoints: { type: Number },
    message: { type: String },
  },
  { timestamps: true }
);

export type IUserPointTransactionsModel = IUserPointTransactions & Document;
export const UserPointTransactions = model<IUserPointTransactionsModel>(
  "UserPointTransactions",
  UserPointTransactionsSchema
);
