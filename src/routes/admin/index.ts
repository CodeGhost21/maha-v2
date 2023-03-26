import { Router } from "express";

import { authenticateJWT } from "../../middleware/authenticateJWT";
import user from "./user";
import discord from "./discord";
import loyalty from "./loyalty";
import organization from "./organization";
import loyaltyTask from "./loyaltyTask";
import task from "./task";

const router = Router();
router.get("/", (_req, res) => {
  res.json({ message: "api running successfully" });
});

router.use(authenticateJWT);

router.use("/discord", discord);
router.use("/user", user);
router.use("/loyalty", loyalty);
router.use("/organization", organization);
router.use("/loyaltyTask", loyaltyTask);
router.use("/task", task);

export default router;
