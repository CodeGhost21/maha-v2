import { IWalletUserPoints, IEpoch } from "./walletUserPoints";

export interface IWalletUser {
  discordId: string;
  jwt: string;
  rank: number;
  referralCode: string[];
  referredBy: string;
  totalPoints: number;
  walletAddress: string;
  role: string;
  epoch: number;
  points: IWalletUserPoints;
  // pointsUpdateTimestamp: IWalletUserPoints;
  pointsPerSecond: IWalletUserPoints;
  pointsPerSecondUpdateTimestamp: IWalletUserPoints;
  epochs: IEpoch;
}
