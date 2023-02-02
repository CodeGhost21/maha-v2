import { Request, Response } from "express";
import { MarketPlace } from "../database/models/marketPlace";
import marketplaceData from "../assets/marketPlace.json";

export const getMarketPlaceData = async (req: Request, res: Response) => {
  const allItems = await MarketPlace.find();
  if (allItems.length > 0) res.send(allItems);
  else res.send([]);
};

export const addRewardsItem = async () => {
  marketplaceData.map(async (item: any) => {
    const newItem = new MarketPlace({
      name: item.name,
      imgUrl: item.imgUrl,
      price: item.price,
      stock: item.stock,
    });
    await newItem.save();
  });
};

// addRewardsItem();
