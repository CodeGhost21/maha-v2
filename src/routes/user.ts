import { Router } from "express";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import deserializeUser from "../middleware/deserializeUser";

const router = Router();

import {
  walletVerify,
  getTotalReferralOfUsers,
  getUserReferralData,
  getReferralUsers,
  getTotalUsers,
  // getLeaderBoard,
  // getUsersData,
  // galxeLPCheck,
  // getUserTransactions,
  // getLPData,
  // getUserTotalPoints,
  userInfo,
  getCurrentPoints,
} from "../controller/user";

router.post("/login", walletVerify);
router.get("/userInfo", userInfo);
router.get("/totalReferrals", getTotalReferralOfUsers);
router.get("/referralUsers", getReferralUsers);
router.get("/referral", getUserReferralData);
router.get("/currentPoints", getCurrentPoints);
router.get("/totalUsers", getTotalUsers);
// router.get("/globalData", getUsersData);
// router.get("/leaderBoard", getLeaderBoard);
// router.get("/info", galxeLPCheck);
// router.get("/lpData", getLPData);
// router.get("/userTotalPoints", getUserTotalPoints);
// router.get("/me", fetchMe);
// router.get("/transactions", getUserTransactions);

router.use(deserializeUser, ensureLoggedIn);

export default router;
