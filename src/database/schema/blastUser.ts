import { Schema } from "mongoose";
import { IBlastMetadata } from "../interface/blast/blastMetadata";

export const BlastUserSchema = new Schema(
  {
    walletAddress: { type: String, index: true, unique: true },
    blastPoints: {
      type: {} as IBlastMetadata,
      default: {} as IBlastMetadata,
      index: true,
    },
    blastGold: {
      type: {} as IBlastMetadata,
      default: {} as IBlastMetadata,
      index: true,
    },
  },
  { timestamps: true }
);
