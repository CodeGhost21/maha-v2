import { Schema } from "mongoose";

export const BlastBatchesSchema = new Schema(
  {
    batchId: { type: Number },
    batch: { type: Array },
  },
  { timestamps: true }
);
