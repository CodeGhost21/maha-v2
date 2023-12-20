import { Router } from "express";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import deserializeUser from "../middleware/deserializeUser";

const router = Router();

import {
  getLeaderBoard,
  walletVerify,
  fetchMe,
  checkTask,
} from "../controller/user";

router.post("/login", walletVerify);
router.get("/lb", getLeaderBoard);

router.use(deserializeUser);
router.use(ensureLoggedIn);
router.get("/me", fetchMe);
router.post("/check", checkTask);

export default router;
