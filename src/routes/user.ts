import { Router } from "express";
import { authenticateJWT } from "../middleware/authenticateJWT";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import {
  walletVerify,
  getLeaderboard,
  fetchMe,
  getRecentRewards,
  getUsersDailyPoints,
} from "../controller/user";

const router = Router();

// router.get("/fetch/:id", fetchUser); // <- need to hide sensitive datapoints
router.get("/leaderBoard", getLeaderboard);

router.use(authenticateJWT);
router.use(ensureLoggedIn);

router.get("/me", fetchMe); // <- need to hide sensitive datapoints

// dummy api for users daily points
router.get("/dailyPoints", getUsersDailyPoints);
router.get("/recentRewards", getRecentRewards);
router.post("/verifyWallet", walletVerify);

export default router;
