import { Router } from "express";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import deserializeUser from "../middleware/deserializeUser";

const router = Router();

import {
  getLeaderBoard,
  walletVerify,
  fetchMe,
  getTotalUsers,
  getTotalReferralOfUsers,
  getPythData,
  getMantaData,
  getTotalPoints,
} from "../controller/user";
import { checkTask } from "../controller/quests/checkTask";

router.post("/login", walletVerify);
router.get("/lb", getLeaderBoard);
router.get("/pyth", getPythData);
router.get("/manta", getMantaData);
router.get("/totalUsers", getTotalUsers);
router.get("/totalPoints", getTotalPoints); // {'totalPoints': '1000

router.use(deserializeUser, ensureLoggedIn);
router.get("/me", fetchMe);
router.post("/check", checkTask);
router.post("/totalReferrals", getTotalReferralOfUsers);

export default router;
