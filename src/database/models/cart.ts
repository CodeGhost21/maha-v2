import mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { IUser } from "./user";

export interface ICart {
  userId: IUser;
}

const cart = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
});

export type ICartModel = ICart & Document;
export const Cart = mongoose.model("Cart", cart);
