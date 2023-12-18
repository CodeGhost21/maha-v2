import { Router } from "express";
import { getLeaderBoard, walletVerify } from "../controller/user";
import discord from "./discord";

export const router = Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});

router.post("/login", walletVerify);
router.get("/lb", getLeaderBoard);

router.use("/discord", discord);

export default router;
