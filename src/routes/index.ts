import { Router } from "express";
import user from "./user";
import discord from "./discord";
import product from "./product";
import cart from "./cart";

const router = Router();
router.get("/", (_req, res) => {
  res.json({ message: "api running successfully" });
});

router.use("/user", user);
router.use("/product", product);
router.use("/discord", discord);
router.use("/cart", cart);

export default router;
