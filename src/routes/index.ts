import { Router } from "express";

import { authenticateJWT } from "../middleware/authenticateJWT";
import user from "./user";
import discord from "./discord";
import product from "./product";
import cart from "./cart";
import twitter from "./twitter";
import loyalty from "./loyalty";
import feed from "./feed";
import organization from "./organization";
import loyaltyTask from "./loyaltyTask";
import task from "./task";

const router = Router();
router.get("/", (_req, res) => {
  res.json({ message: "api running successfully" });
});

router.use(authenticateJWT);

router.use("/user", user);
router.use("/product", product);
router.use("/discord", discord);
router.use("/twitter", twitter);
router.use("/cart", cart);
router.use("/loyalty", loyalty);
router.use("/feed", feed);
router.use("/organization", organization);
router.use("/loyaltyTask", loyaltyTask);
router.use("/task", task);

export default router;
