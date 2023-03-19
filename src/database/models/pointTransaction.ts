import { Document, Schema } from "mongoose";
import mongoose from "mongoose";
import { IUser } from "./user";
import { IMessage } from "./message";

export interface IPointTransaction {
  userId: IUser;
  messageId?: IMessage;
  metadata: object;
  type: string;
  totalPoints: number;
  addPoints: number;
  subPoints: number;

  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    messageId: { type: Schema.Types.ObjectId, ref: "Message" },
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
