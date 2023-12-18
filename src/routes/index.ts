import { Router } from "express";
import { getLeaderBoard, walletVerify } from "../controller/user";

export const router = Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});

router.post("/login", walletVerify);
router.get("/lb", getLeaderBoard);

export default router;
