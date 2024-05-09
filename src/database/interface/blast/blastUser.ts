import { IBlastMetadata } from "./blastMetadata";

export interface IBlastUser {
  walletAddress: string;
  blastPoints: IBlastMetadata;
  blastGold: IBlastMetadata;
}
