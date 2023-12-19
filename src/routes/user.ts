import { Router } from "express";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import deserializeUser from "../middleware/deserializeUser";

const router = Router();

import {
  getLeaderBoard,
  walletVerify,
  addDiscordProfile,
} from "../controller/user";

router.post("/login", walletVerify);
router.get("/lb", getLeaderBoard);

router.use(deserializeUser);
router.use(ensureLoggedIn);
router.post("/update", addDiscordProfile);

export default router;
