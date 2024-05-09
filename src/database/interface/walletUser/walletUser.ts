import { IWalletUserPoints } from "./walletUserPoints";

export interface IWalletUser {
  discordId: string;
  jwt: string;
  rank: number;
  referralCode: string;
  referredBy: string;
  totalPointsV2: number;
  claimedTotalPointsV2: number;
  twitterId: string;
  twitterOauthToken: string;
  twitterOauthTokenSecret: string;
  walletAddress: string;
  role: string;
  epoch: number;
  points: IWalletUserPoints;
  pointsUpdateTimestamp: IWalletUserPoints;
  epochs: IWalletUserPoints;
  isDeleted: boolean;
}
