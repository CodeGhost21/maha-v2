export interface IUser {
  userTag: string;
  userID: string;
  totalGMs: number;
  lastGM: Date;
  lastImage: Date;
  gmRank: number;
  jwt: string;
  discordName: string;
  discordDiscriminator: string;
  discordAvatar: string;
  walletAddress: string;
  discordVerify: boolean;
  totalPoints: number;
}
