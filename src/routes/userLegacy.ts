import { Router } from "express";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import deserializeUser from "../middleware/deserializeUser";

const router = Router();

import {
  //   getLeaderBoard,
  getTotalUsers,
  getTotalReferralOfUsers,
  getTotalPoints,
  getUserReferralData,
  getReferralUsers,
  getUserTransactions,
  getUserTotalPoints,
} from "../controller/userLegacy";

// router.get("/lb", getLeaderBoard);
router.get("/totalUsers", getTotalUsers);
router.get("/totalPoints", getTotalPoints);
router.get("/referral", getUserReferralData); // {'totalPoints': '1000
router.get("/userTotalPoints", getUserTotalPoints);

router.use(deserializeUser, ensureLoggedIn);
router.get("/totalReferrals", getTotalReferralOfUsers);
router.get("/referralUsers", getReferralUsers);
router.get("/transactions", getUserTransactions);

export default router;
