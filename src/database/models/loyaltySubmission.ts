// a submission made by a user performign a loyalty task; similar to pointTransaction

// user -> loyaltySubmissions = one-to-many

import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./user";
import { ILoyaltyTaskModel } from "./loyaltyTasks";

export interface ILoyaltySubmission {
  userId: IUser;
  taskId: ILoyaltyTaskModel; //loyalty task
  type: string;
  totalPoints: number;
  boost: number; // what was the boost given at that point in time
  loyalty: number; // what aws the user's loyalty at that point in time
}

const loyaltySubmission = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    taskId: { type: Schema.Types.ObjectId, ref: "LoyaltyTask" },
    type: { type: String, default: "" },
    totalPoints: Number,
    boost: { type: Number, default: 0 },
    loyalty: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type ILoyaltySubmissionModel = ILoyaltySubmission & Document;
export const LoyaltySubmission = mongoose.model<ILoyaltySubmissionModel>(
  "LoyaltySubmission",
  loyaltySubmission
);
