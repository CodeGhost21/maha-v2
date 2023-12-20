import { Router } from "express";
import discord from "./discord";
import user from "./user";
import twitter from "./twitter";

export const router = Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});

router.use("/discord", discord);
router.use("/twitter", twitter);
router.use("/user", user);

export default router;
