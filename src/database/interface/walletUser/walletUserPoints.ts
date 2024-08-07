import { IAsset, IStakeAsset } from "./assets";

export interface IWalletUserPoints {
  discordFollow?: number;
  referral?: number;
  gm?: number;
  erc20Ethereum?: IAsset;
}

export interface IEpoch {
  discordFollow?: number;
  referral?: number;
  gm: number;
  erc20Ethereum: number;
}
