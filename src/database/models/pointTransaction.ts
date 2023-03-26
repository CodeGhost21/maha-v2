import { Document, Schema } from "mongoose";
import mongoose from "mongoose";
import { ITaskModel } from "./tasks";
import { IServerProfileModel } from "./serverProfile";

export interface IPointTransaction {
  profileId: IServerProfileModel;
  taskId: ITaskModel;
  metadata: any;
  type: string;
  totalPoints: number;
  addPoints: number;
  subPoints: number;
  boost: number; // what was the boost given at that point in time
  loyalty: number; // what aws the user's loyalty at that point in time

  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema(
  {
    profileId: { type: Schema.Types.ObjectId, ref: "ServerProfile" },
    taskId: { type: Schema.Types.ObjectId, ref: "Task" },
    metadata: { type: Object, default: {} },
    type: { type: String, default: "" },
    totalPoints: Number,
    addPoints: { type: Number, default: 0 },
    subPoints: { type: Number, default: 0 },
    boost: { type: Number, default: 0 }, // what was the boost given at that point in time
    loyalty: { type: Number, default: 0 }, // what aws the user's loyalty at that point in time
  },
  { timestamps: true }
);

export type IPointTransactionModel = IPointTransaction & Document;
export const PointTransaction = mongoose.model<IPointTransactionModel>(
  "PointTransaction",
  schema
);
