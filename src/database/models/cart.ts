import mongoose, { Document, Schema } from "mongoose";
import { IUserModel } from "./user";

export interface ICart {
  userId: IUserModel;
}

const cart = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
});

export type ICartModel = ICart & Document;
export const Cart = mongoose.model<ICartModel>("Cart", cart);
