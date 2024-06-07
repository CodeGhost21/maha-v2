import { Schema } from "mongoose";
import { Transfer } from "../interface/blast/blastBatches";

export const BlastBatchesSchema = new Schema(
  {
    batchId: { type: String },
    batch: { type: [] as Transfer[]},
  },
  { timestamps: true }
);
