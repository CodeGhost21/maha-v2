import { Router } from "express";
import user from "./user";
import discord from "./discord";
import marketPlace from "./marketplace";

const router = Router();
router.get("/", (req, res) => {
  res.send("API Running successfully");
  // next(new Error("hello world"))
});

router.use("/user", user);
router.use("/marketPlace", marketPlace);
router.use("/discord", discord);

export default router;
