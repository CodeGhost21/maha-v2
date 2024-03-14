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
  getUserReferralData,
  getReferralUsers,
  galxeLPCheck,
  getUserTransactions,
  getLPData,
  getUserTotalPoints,
} from "../controller/user";
import { checkTask } from "../controller/quests/checkTask";

router.post("/login", walletVerify);
router.get("/lb", getLeaderBoard);
router.get("/pyth", getPythData);
router.get("/manta", getMantaData);
router.get("/totalUsers", getTotalUsers);
router.get("/totalPoints", getTotalPoints);
router.get("/referral", getUserReferralData); // {'totalPoints': '1000
router.get("/info", galxeLPCheck);
router.get("/lpData", getLPData);

router.use(deserializeUser, ensureLoggedIn);
router.get("/me", fetchMe);
router.post("/check", checkTask);
router.get("/totalReferrals", getTotalReferralOfUsers);
router.get("/referralUsers", getReferralUsers);
router.get("/transactions", getUserTransactions);
router.get("/userTotalPoints", getUserTotalPoints);

export default router;
