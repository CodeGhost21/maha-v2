import { Router } from "express";
import user from "./user";
import discord from "./discord";
import product from "./product";
import cart from "./cart";

const router = Router();
router.get("/", (req, res) => {
  res.send("API Running successfully");
  // next(new Error("hello world"))
});

router.use("/user", user);
router.use("/product", product);
router.use("/discord", discord);
router.use("/cart", cart);

export default router;
