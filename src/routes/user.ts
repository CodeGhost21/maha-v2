import { Router } from "express";
import { walletVerify, fetchMe } from "../controller/user";

const router = Router();

router.get("/me", fetchMe);
router.post("/verifyWallet", walletVerify);

export default router;
