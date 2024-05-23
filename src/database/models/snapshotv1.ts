import mongoose, { Schema } from "mongoose";

export interface ISnapshotV1 {
  walletAddress: string;
  supplyZksync: number;
  supplyManta: number;
  supplyLinea: number;
  supplyXLayer: number;
  supplyEthereum: number;
  supplyBlast: number;
  borrowZksync: number;
  borrowManta: number;
  borrowLinea: number;
  borrowXLayer: number;
  borrowEthereum: number;
  borrowBlast: number;
  totalSupply: number;
  totalBorrow: number;
}

export const SnapshotV1Schema = new Schema(
  {
    walletAddress: String,
    supplyZksync: { type: Number, default: 0 },
    supplyManta: { type: Number, default: 0 },
    supplyLinea: { type: Number, default: 0 },
    supplyXLayer: { type: Number, default: 0 },
    supplyEthereum: { type: Number, default: 0 },
    supplyBlast: { type: Number, default: 0 },
    borrowZksync: { type: Number, default: 0 },
    borrowManta: { type: Number, default: 0 },
    borrowLinea: { type: Number, default: 0 },
    borrowXLayer: { type: Number, default: 0 },
    borrowEthereum: { type: Number, default: 0 },
    borrowBlast: { type: Number, default: 0 },
    totalSupply: { type: Number, default: 0 },
    totalBorrow: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type ISnapshotV1Model = ISnapshotV1 & mongoose.Document;
export const SnapshotV1 = mongoose.model<ISnapshotV1Model>(
  "SnapshotV1",
  SnapshotV1Schema
);
