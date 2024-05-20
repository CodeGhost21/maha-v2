import mongoose, { Schema } from "mongoose";

export interface ISnapshot {
  walletAddress: string;
  supplyZksync: number;
  supplyManta: number;
  supplyLinea: number;
  supplyXLayer: number;
  supplyEthereum: number;
  supplyBlast: number;
  totalSupply: number;
}

export const SnapshotSchema = new Schema(
  {
    walletAddress: String,
    supplyZksync: { type: Number, default: 0 },
    supplyManta: { type: Number, default: 0 },
    supplyLinea: { type: Number, default: 0 },
    supplyXLayer: { type: Number, default: 0 },
    supplyEthereum: { type: Number, default: 0 },
    supplyBlast: { type: Number, default: 0 },
    totalSupply: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type ISnapshotModel = ISnapshot & mongoose.Document;
export const Snapshot = mongoose.model<ISnapshotModel>(
  "Snapshot",
  SnapshotSchema
);
