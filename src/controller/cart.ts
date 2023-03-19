import { NextFunction, Response } from "express";
import { Cart } from "../database/models/cart";
import { CartItem } from "../database/models/cartItems";
import { Product } from "../database/models/product";
import { User, IUserModel } from "../database/models/user";
import { PassportRequest } from "../interface";

export const addItem = async (
  req: PassportRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next();

  const user: IUserModel = req.user;

  let cart = await Cart.findOne({ userId: user.id });
  if (!cart) {
    cart = await Cart.create({
      userId: user.id,
    });
  }

  const checkCartItem = await CartItem.findOne({
    productId: req.body.productId,
  });

  if (!checkCartItem) {
    const newItem = new CartItem({
      cartId: cart.id,
      productId: req.body.productId,
    });
    await newItem.save();

    const product = await Product.findOne({ _id: req.body.productId });
    if (!product) return next();

    await User.updateOne(
      { id: user.id },
      { $inc: { totalPoints: -product.price } }
    );

    res.json({ success: true });
  } else {
    res.json({ success: false, msg: "item already added" });
  }
};

export const removeItem = async (
  req: PassportRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next();

  // @ts-ignore
  const user: IUserModel = req.user;

  const cart = await Cart.findOne({ userId: user.id });
  if (cart) {
    const cartItem = await CartItem.findOne({
      productId: req.body.productId,
    });
    if (cartItem) {
      const product = await Product.findOne({
        _id: req.body.productId,
      });

      if (!product) return next();

      await User.updateOne(
        { id: user.id },
        { $inc: { totalPoints: product.price } }
      );
    }
    res.json({ success: true });
  }
  res.json();
};

export const allItems = async (
  req: PassportRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next();
  const user: IUserModel = req.user;

  const cart = await Cart.findOne({ userId: user.id });
  if (cart) {
    const cartItems = await CartItem.find({ cartId: cart.id }).populate(
      "productId"
    );

    const allItems = cartItems.map((item) => item.productId);
    res.json(allItems);
  } else {
    res.json([]);
  }
};

export const buyNow = async (
  req: PassportRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next();

  const user: IUserModel = req.user;
  try {
    const cart = await Cart.findOne({ userId: user.id });
    if (cart) {
      const cartItems = await CartItem.find({ cartId: cart._id });
      cartItems.map(async (item) => {
        await Product.updateOne(
          { id: item.productId },
          { $set: { userId: user.id } }
        );
        await CartItem.deleteOne({ _id: item.id });
      });
      await Cart.deleteOne({ _id: cart.id });
    }
    res.json({ success: true });
  } catch (e) {
    console.log(e);
  }
};
