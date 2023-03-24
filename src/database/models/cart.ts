import mongoose, { Document, Schema } from "mongoose";
import { IUserModel } from "./user";

export interface ICart {
  userId: IUserModel;
}

// TODO: remove this completely; cart needs to be handled on the frontend side; not backend.

const schema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
});

export type ICartModel = ICart & Document;
export const Cart = mongoose.model<ICartModel>("Cart", schema);
