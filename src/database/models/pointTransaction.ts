import { Document, Schema } from "mongoose";
import mongoose from "mongoose";
import { IUser } from "./user";
import { IMessage } from "./message";
import { ITaskModel } from "./tasks";

export interface IPointTransaction {
  userId: IUser;
  // messageId?: IMessage;
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
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    // messageId: { type: Schema.Types.ObjectId, ref: "Message" },
    taskId: { type: Schema.Types.ObjectId, ref: "Task" },
    metadata: { type: Object, default: {} },
    type: { type: String, default: "" },
    totalPoints: Number,
    addPoints: { type: Number, default: 0 },
    subPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type IPointTransactionModel = IPointTransaction & Document;
export const PointTransaction = mongoose.model<IPointTransactionModel>(
  "PointTransaction",
  schema
);
