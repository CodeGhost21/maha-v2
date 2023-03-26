import { Router } from "express";
import * as Twitter from "../controller/twitter";

const router = Router();

router.get("/oauth/requestToken", Twitter.requestToken);
router.post("/oauth/verify", Twitter.verifyAccessToken);

export default router;
