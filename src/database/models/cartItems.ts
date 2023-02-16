import mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { ICart } from "./cart";
import { IProduct } from "./product";

export interface ICartItem {
  productId: IProduct;
  cartId: ICart;
}

const cartItem = new mongoose.Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  cartId: { type: Schema.Types.ObjectId, ref: "Cart" },
});

export type ICartItemModel = ICartItem & Document;
export const CartItem = mongoose.model("CartItem", cartItem);
