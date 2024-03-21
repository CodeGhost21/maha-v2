import { Document, model, Schema } from "mongoose";

export interface IBlastMetadata {
  pointsGiven: number;
  pointsPending: number;
  pointsPendingUSDB: number;
  pointsPendingWETH: number;
  shares: number;
  sharePercent: number;
  timestamp: number;
}

export interface IBlastUser {
  walletAddress: string;
  blastPoints: IBlastMetadata;
  blastGold: IBlastMetadata;
}

const BlastUserSchema = new Schema(
  {
    walletAddress: { type: String, index: true },
    blastPoints: { type: Object, default: {} },
    blastGold: { type: Object, default: {} },
  },
  { timestamps: true }
);

export type IBlastUserModel = IBlastUser & Document;
export const BlastUser = model<IBlastUserModel>("BlastUser", BlastUserSchema);
