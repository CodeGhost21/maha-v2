import { Router } from "express";
import user from "./user";
import discord from "./discord";
import product from "./product";
import cart from "./cart";
import twitter from './twitter';
import loyalty from './loyalty'

const router = Router();
router.get("/", (_req, res) => {
  res.json({ message: "api running successfully" });
});

router.use("/user", user);
router.use("/product", product);
router.use("/discord", discord);
router.use("/twitter", twitter);
router.use("/cart", cart);
router.use("/loyalty", loyalty)

export default router;
