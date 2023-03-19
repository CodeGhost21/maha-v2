import { Router } from "express";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import {
  walletVerify,
  getLeaderboard,
  fetchMe,
  getRecentRewards,
  getUsersDailyPoints,
} from "../controller/user";

const router = Router();

router.get("/leaderBoard", getLeaderboard);

router.use(ensureLoggedIn);

router.get("/me", fetchMe);
router.get("/dailyPoints", getUsersDailyPoints);
router.get("/recentRewards", getRecentRewards);
router.post("/verifyWallet", walletVerify);

export default router;
