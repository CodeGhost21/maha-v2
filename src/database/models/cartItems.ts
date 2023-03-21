import mongoose, { Document, Schema } from "mongoose";
import { ICartModel } from "./cart";
import { IProductModel } from "./product";

export interface ICartItem {
  productId: IProductModel;
  cartId: ICartModel;
}

const cartItem = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  cartId: { type: Schema.Types.ObjectId, ref: "Cart" },
});

export type ICartItemModel = ICartItem & Document;
export const CartItem = mongoose.model<ICartItemModel>("CartItem", cartItem);
