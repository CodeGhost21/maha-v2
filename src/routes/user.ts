import { Router } from "express";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import {
  walletVerify,
  getLeaderBoard,
  fetchMe,
  getRecentRewards,
  getUsersDailyPoints,
  allUsers,
} from "../controller/user";

const router = Router();

router.get("/leaderBoard", getLeaderBoard);

router.use(ensureLoggedIn);

router.get("/me", fetchMe);
router.get("/dailyPoints", getUsersDailyPoints);
router.get("/recentRewards", getRecentRewards);
router.post("/verifyWallet", walletVerify);
router.get("/allUsers", allUsers);

export default router;
