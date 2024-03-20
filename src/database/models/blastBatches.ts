import { Document, model, Schema } from "mongoose";

export interface IBlastBatches {
  batchId: number;
  batch: any[];
}

const BlastBatchesSchema = new Schema(
  {
    batchId: { type: Number },
    batch: { type: Array },
  },
  { timestamps: true }
);

export type IBlastBatchesModel = IBlastBatches & Document;
export const BlastBatches = model<IBlastBatchesModel>(
  "BlastBatches",
  BlastBatchesSchema
);
