import { Router } from "express";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import deserializeUser from "../middleware/deserializeUser";

const router = Router();

import {
  getLeaderBoard,
  walletVerify,
  addDiscordProfile,
  fetchMe,
  checkTask,
} from "../controller/user";

router.post("/login", walletVerify);
router.get("/lb", getLeaderBoard);

router.use(deserializeUser);
router.use(ensureLoggedIn);
router.post("/update", addDiscordProfile);
router.get("/me", fetchMe);
router.post("/check", checkTask);

export default router;
