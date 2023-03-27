import { Router } from "express";

import admin from "./admin";
import twitter from "./twitter";
import user from "./user";
const router = Router();
router.get("/", (_req, res) => {
  res.json({ message: "api running successfully" });
});

router.use("/admin", admin);
router.use("/twitter", twitter);
router.use("/user", user);
export default router;
