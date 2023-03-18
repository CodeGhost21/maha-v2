import mongoose from "mongoose";
import { Document, Schema } from "mongoose";
import { IUser } from "./user";

export interface IProduct {
  name: string;
  imgUrl: string;
  price: number;
  stock: number;
  desc: string;
  userId?: IUser;
}

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    imgUrl: String,
    price: Number,
    stock: Number,
    desc: String,
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type IProductModel = IProduct & Document;
export const Product = mongoose.model<IProductModel>("Product", ProductSchema);
