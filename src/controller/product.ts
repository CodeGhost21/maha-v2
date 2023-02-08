import { Request, Response } from "express";
import { Product } from "../database/models/product";
import marketplaceData from "../assets/marketPlace.json";

export const getAllProduct = async (req: Request, res: Response) => {
  const allItems = await Product.find();
  if (allItems.length > 0) res.send(allItems);
  else res.send([]);
};

export const addProduct = async () => {
  marketplaceData.map(async (item: any) => {
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
// addProduct();

export const getProduct = async (req: Request, res: Response) => {
  const product = await Product.findOne({ _id: req.body.productId });
  if (product) {
    res.send(product);
  }
};
