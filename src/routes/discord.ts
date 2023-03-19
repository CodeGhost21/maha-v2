import { Router } from "express";

import { loginWithDiscord, verifyWithDiscord } from "../controller/login";

const router = Router();

router.get("/login", loginWithDiscord);
router.get("/redirect", verifyWithDiscord);

export default router;
