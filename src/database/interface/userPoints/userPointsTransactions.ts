import { IWalletUserModel } from "../../models/walletUsersV2";

export interface IUserPointTransactions {
  userId: IWalletUserModel;
  previousPoints: number;
  currentPoints: number;
  subPoints: number;
  addPoints: number;
  message: string;
}
