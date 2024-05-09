import { Document, model } from "mongoose";
import { IBlastBatches } from "../interface/blast/blastBatches";
import { BlastBatchesSchema } from "../schema/blastBatch";

export type IBlastBatchesModel = IBlastBatches & Document;
export const BlastBatches = model<IBlastBatchesModel>(
  "BlastBatches",
  BlastBatchesSchema
);
