export const points = {
  discordFollow: 100,
  twitterFollow: 100,
  gm: 10,
};

export const referralPercent = 0.2;

export interface Multiplier {
  usdz?: number;
  default: number;
}

export const stakeZeroMultiplier = 1.5;
export const minAmount = 0;
export const maxAmount = 50000000; /// 50M
export const minBoost = 1;
export const maxBoost = 5;
export const minimumUSDSupplyPerAsset = 10; // $10
export const ethLrtMultiplier: Multiplier = {
  usdz: 3,
  default: 1,
};

export const baseUrl =
  "https://api.goldsky.com/api/public/project_clsk1wzatdsls01wchl2e4n0y/subgraphs/";
export const apiMaha = baseUrl + "maha-erc20s-mainnet/1.0.0/gn";

export const assetDenomination = {
  usdz: 1e18,
  susdz: 1e18,
  maha: 1e18,
  szaifraxbp: 1e18,
};
