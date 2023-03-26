import { Router } from "express";

import { authenticateJWT } from "../middleware/authenticateJWT";
import user from "./user";
import twitter from "./twitter";
import loyalty from "./loyalty";
import task from "./task";

const router = Router();
router.get("/", (_req, res) => {
  res.json({ message: "api running successfully" });
});

router.use(authenticateJWT);

router.use("/user", user);
router.use("/twitter", twitter);
router.use("/loyalty", loyalty);
router.use("/task", task);

export default router;
