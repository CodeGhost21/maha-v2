import { NextFunction, Request, Response } from "express";
import { Cart } from "../database/models/cart";
import { CartItem } from "../database/models/cartItems";
import { Product } from "../database/models/product";
import { User, IUserModel } from "../database/models/user";
import BadRequestError from "../errors/BadRequestError";
import NotFoundError from "../errors/NotFoundError";

export const addItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next();

  const user = req.user as IUserModel;
  const cart = await user.getCart();

  const product = await Product.findOne({ _id: req.body.productId });
  if (!product) return next();

  const checkCartItem = await CartItem.findOne({
    productId: req.body.productId,
    cartId: cart.id,
  });

  if (!checkCartItem) {
    await CartItem.create({
      cartId: cart.id,
      productId: req.body.productId,
    });

    await User.updateOne(
      { id: user.id },
      { $inc: { totalPoints: -product.price } }
    );

    res.json({ success: true });
  } else {
    res.json({ success: false, msg: "item already added" });
  }
};

export const removeItem = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const cart = await user.getCart();

  const cartItem = await CartItem.findOne({
    cartId: cart.id,
    productId: req.body.productId,
  });

  if (cartItem) {
    const product = await Product.findOne({
      _id: req.body.productId,
    });

    if (!product) throw new NotFoundError();

    await User.updateOne(
      { id: user.id },
      { $inc: { totalPoints: product.price } }
    );

    return res.json({ success: true });
  }

  throw new BadRequestError();
};

export const allItems = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;

  const cart = await user.getCart();

  const cartItems = await CartItem.find({ cartId: cart.id }).populate(
    "productId"
  );

  const allItems = cartItems.map((item) => item.productId);
  res.json(allItems);
};

export const buyNow = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;

  const cart = await user.getCart();

  const cartItems = await CartItem.find({ cartId: cart._id });
  cartItems.map(async (item) => {
    await Product.updateOne(
      { id: item.productId },
      { $set: { userId: user.id } }
    );
    await CartItem.deleteOne({ _id: item.id });
  });

  await Cart.deleteOne({ _id: cart.id });

  res.json({ success: true });
};
