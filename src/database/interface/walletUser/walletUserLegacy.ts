export interface IWalletUserChecked {
  gm: boolean;
  AAVEStaker: boolean;
  LQTYHolder: boolean;
  LUSDHolder: boolean;
  MAHAStaker: boolean;
  AAVEStakers: boolean;
  discordFollow: boolean;
  discordVerify: boolean;
  twitterVerify: boolean;
  twitterFollow: boolean;
  PythStaker: boolean;
  MantaStaker: boolean;
  HoldStationStaker: boolean;
  CakeStaker: boolean;
  MahaXStaker: boolean;
}

export interface IWalletUserPointsLegacy {
  AAVEStaker: number;
  discordFollow: number;
  gm: number;
  liquidityONEZ: number;
  LQTYHolder: number;
  LUSDHolder: number;
  MAHAStaker: number;
  mintingONEZ: number;
  referral: number;
  supply: number;
  borrow: number;
  supplyManta: number;
  borrowManta: number;
  supplyBlast: number;
  borrowBlast: number;
  supplyLinea: number;
  borrowLinea: number;
  supplyEthereumLrt: number;
  borrowEthereumLrt: number;
  supplyXLayer: number;
  borrowXLayer: number;
  twitterFollow: number;
  PythStaker: number;
  MantaStaker: number;
  HoldStationStaker: number;
  CakeStaker: number;
  MahaXStaker: number;
  supplyEthereumLrtEth: number;
  borrowEthereumLrtEth: number;
  supplyLineaEzEth: number;
  supplyBlastEzEth: number;
  supplyEthereumLrtEzEth: number;
  supplyEthereumLrtRsEth: number;
  supplyZkSyncLido: number;
  miscellaneousPoints: number;
  // total: number;
}

// export interface ITaskName {
//   Linea: number;
//   EthereumLrt: number;
//   Manta: number;
//   Zksync: number;
//   Blast: number;
//   Xlayer: number;
// }

export interface IWalletUserLegacy {
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

  checked: IWalletUserChecked;
  points: IWalletUserPointsLegacy;
  pointsUpdateTimestamp: IWalletUserPointsLegacy;
  epochs: IWalletUserPointsLegacy;

  isDeleted: boolean;
}
