import { Schema } from "mongoose";
import { IBlastMetadata } from "../interface/blast/blastMetadata";

export const BlastUserSchema = new Schema(
  {
    walletAddress: { type: String, index: true },
    blastPoints: { type: {} as IBlastMetadata, default: {} },
    blastGold: { type: {} as IBlastMetadata, default: {} },
  },
  { timestamps: true }
);
