import { Router } from "express";

import admin from "./admin";
import twitter from "./twitter";

const router = Router();
router.get("/", (_req, res) => {
  res.json({ message: "api running successfully" });
});

router.use("/admin", admin);
router.use("/twitter", twitter);

export default router;
