import mongoose from "mongoose";

export interface IMarketPlace {
  name: string;
  imgUrl: string;
  price: number;
  stock: number;
}

const MarketPlaceSchema = new mongoose.Schema(
  {
    name: String,
    imgUrl: String,
    price: Number,
    stock: Number,
  },
  { timestamps: true }
);

export type IMarketPlaceModel = IMarketPlace & mongoose.Document;
export const MarketPlace = mongoose.model("MarketPlace", MarketPlaceSchema);
