import mongoose from "mongoose";

export interface IUserPoints {
  userId: string;
  previosPoints: number;
  currentPoints: number;
  subPoints: number;
  addPoints: number;
  message: string;
}

const UserPointsSchema = new mongoose.Schema(
  {
    userId: { type: String },
    previosPoints: { type: Number },
    currentPoints: { type: Number },
    subPoints: { type: Number },
    addPoints: { type: Number },
  },
  { timestamps: true }
);

export type IUserPointsModel = IUserPoints & mongoose.Document;
export const UserPoints = mongoose.model<IUserPointsModel>(
  "UserPoints",
  UserPointsSchema
);
