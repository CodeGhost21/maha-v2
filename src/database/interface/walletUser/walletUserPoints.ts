import { IAsset } from "./assets";

export interface IWalletUserPoints {
  discordFollow?: number;
  gm?: number;
  referral?: number;
  mahaXStaker?: number;
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
  gm?: number;
  referral?: number;
  mahaXStaker?: number;
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
