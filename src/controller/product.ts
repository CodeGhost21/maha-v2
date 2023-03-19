import { NextFunction, Request, Response } from "express";
import { Product } from "../database/models/product";
import marketplaceData from "../assets/marketPlace.json";

export const getAllProduct = async (_req: Request, res: Response) => {
  const allItems = await Product.find().limit(100);
  res.json(allItems);
};

export const addProduct = async () => {
  marketplaceData.map(async (item) => {
    const newItem = new Product({
      name: item.name,
      imgUrl: item.imgUrl,
      price: item.price,
      stock: item.stock,
      desc: item.desc,
    });
    await newItem.save();
  });
};

export const getProduct = async (req: Request, res: Response) => {
  const product = await Product.findOne({ _id: req.params.productId });
  return res.json(product);
};
