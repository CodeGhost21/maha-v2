import { Router } from "express";
import { authenticateJWT } from "../middleware/authenticateJWT";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import {
  walletVerify,
  getLeaderboard,
  fetchUser,
  getRecentRewards,
  getUsersDailyPoints,
} from "../controller/user";

const router = Router();
router.get("/fetch/:jwt", async (req: any, res) => fetchUser(req, res));
router.get("/leaderBoard", (req, res) => getLeaderboard(req, res));

router.use(authenticateJWT);
router.use(ensureLoggedIn);

//dummy api for users daily points
router.get("/dailyPoints", (req, res) => getUsersDailyPoints(req, res));
router.get("/recentRewards", (req, res) => getRecentRewards(req, res));

router.post("/verifyWallet", (req, res) => {
  walletVerify(req, res);
});

export default router;
