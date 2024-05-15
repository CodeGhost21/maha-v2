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
  getUsersData,
  getUserReferralData,
  getReferralUsers,
  galxeLPCheck,
  getUserTransactions,
  getLPData,
  getUserTotalPoints,
} from "../controller/user";

router.get("/", getUsersData);
router.post("/login", walletVerify);
// router.get("/lb", getLeaderBoard);
router.get("/referral", getUserReferralData); // {'totalPoints': '1000
// router.get("/info", galxeLPCheck);
// router.get("/lpData", getLPData);
// router.get("/userTotalPoints", getUserTotalPoints);

router.use(deserializeUser, ensureLoggedIn);
router.get("/me", fetchMe);
router.get("/totalReferrals", getTotalReferralOfUsers);
router.get("/referralUsers", getReferralUsers);
// router.get("/transactions", getUserTransactions);

//

export default router;
