import { IAsset } from "./assets";

export interface IWalletUserPoints {
  discordFollow?: number;
  referral?: number;
  stakeZero?: number;
  supplyZkSync?: IAsset;
  borrowZkSync?: IAsset;
  supplyManta?: IAsset;
  borrowManta?: IAsset;
  supplyBlast?: IAsset;
  borrowBlast?: IAsset;
  supplyLinea?: IAsset;
  borrowLinea?: IAsset;
  supplyXLayer?: IAsset;
  borrowXLayer?: IAsset;
  supplyEthereumLrt?: IAsset;
  borrowEthereumLrt?: IAsset;
}

export interface IEpoch {
  discordFollow?: number;
  referral?: number;
  supplyZkSync?: number;
  borrowZkSync?: number;
  supplyManta?: number;
  borrowManta?: number;
  supplyBlast?: number;
  borrowBlast?: number;
  supplyLinea?: number;
  borrowLinea?: number;
  supplyXLayer?: number;
  borrowXLayer?: number;
  supplyEthereumLrt?: number;
  borrowEthereumLrt?: number;
}
