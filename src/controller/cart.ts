import { Response } from "express";
import { Cart } from "../database/models/cart";
import { CartItem } from "../database/models/cartItems";
import { Product } from "../database/models/product";
import { User } from "../database/models/user";

export const addItem = async (req: any, res: Response) => {
  const user = req.user;
  try {
    let cart = await Cart.findOne({ userId: user.id });
    if (!cart) {
      cart = new Cart({
        userId: user.id,
      });
      await cart.save();
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
      const product: any = await Product.findOne({ _id: req.body.productId });
      await User.updateOne(
        { id: user.id },
        { $inc: { totalPoints: -product.price } }
      );

      res.send({ success: true });
    } else {
      res.send({ success: false, msg: "item already added" });
    }
  } catch (e) {
    console.log(e);
  }
};

export const removeItem = async (req: any, res: Response) => {
  const user = req.user;
  try {
    const cart = await Cart.findOne({ userId: user.id });
    if (cart) {
      const cartItem = await CartItem.findOne({
        productId: req.body.productId,
      });
      if (cartItem) {
        const product: any = await Product.findOne({
          _id: req.body.productId,
        });
        await User.updateOne(
          { id: user.id },
          { $inc: { totalPoints: product.price } }
        );
      }
      res.send({ success: true });
    }
    res.send();
  } catch (e) {
    console.log(e);
  }
};

export const allItems = async (req: any, res: Response) => {
  const user = req.user;
  try {
    const cart = await Cart.findOne({ userId: user.id });
    if (cart) {
      const cartItems = await CartItem.find({ cartId: cart.id }).populate(
        "productId"
      );
      const allItems: any = [];
      cartItems.map((item) => {
        allItems.push(item.productId);
      });
      res.send(allItems);
    } else {
      res.send([]);
    }
  } catch (e) {
    console.log(e);
  }
};

export const buyNow = async (req: any, res: Response) => {
  const user = req.user;
  try {
    const cart = await Cart.findOne({ userId: user.id });
    if (cart) {
      const cartItems = await CartItem.find({ cartId: cart._id });
      cartItems.map(async (item: any) => {
        await Product.updateOne(
          { id: item.productId },
          { $set: { userId: user.id } }
        );
        await CartItem.deleteOne({ _id: item.id });
      });
      await Cart.deleteOne({ _id: cart.id });
    }
    res.send({ success: true });
  } catch (e) {
    console.log(e);
  }
};
