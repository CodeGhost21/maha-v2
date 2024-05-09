import { IWalletUserModel } from "src/database/models/walletUsers";

export interface IUserPointTransactions {
  userId: IWalletUserModel;
  previousPoints: number;
  currentPoints: number;
  subPoints: number;
  addPoints: number;
  message: string;
}
