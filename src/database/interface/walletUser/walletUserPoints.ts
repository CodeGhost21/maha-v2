import { IAsset } from "./assets";

export interface IWalletUserPoints {
  discordFollow: number;
  gm: number;
  referral: number;
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
  supplyEthereumLrt?: number;
  borrowEthereumLrt?: number;
}
