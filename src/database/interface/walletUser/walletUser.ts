import { IWalletUserPoints, IEpoch } from "./walletUserPoints";

export interface IWalletUser {
  discordId: string;
  jwt: string;
  rank: number;
  referralCode: string[];
  referrerCode: string;
  referredBy: string;
  totalPoints: number;
  totalSupplyPoints: number;
  totalBorrowPoints: number;
  totalStakePoints: number;
  boostStake: number;
  walletAddress: string;
  role: string;
  epoch: number;
  points: IWalletUserPoints;
  // pointsUpdateTimestamp: IWalletUserPoints;
  pointsPerSecond: IWalletUserPoints;
  pointsPerSecondUpdateTimestamp: IWalletUserPoints;
  epochs: IEpoch;
}
