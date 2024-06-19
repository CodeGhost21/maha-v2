import { Schema } from "mongoose";

export const CacheSchema = new Schema(
  {
    cacheId: { type: String, index: true, unique: true },
    blockNumberLinea: { type: Number, default: 0 },
    blockNumberZkSync: { type: Number, default: 0 },
    blockNumberManta: { type: Number, default: 0 },
    blockNumberBlast: { type: Number, default: 0 },
    blockNumberXLayer: { type: Number, default: 0 },
    blockNumberEthereumLrt: { type: Number, default: 0 },
    blockNumberStakeLinea: { type: Number, default: 0 },
  },
  { timestamps: true }
);
