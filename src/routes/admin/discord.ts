import { Router } from "express";

import { loginWithDiscord, verifyWithDiscord } from "../controller/admin/login";

const router = Router();

router.get("/login", loginWithDiscord);
router.get("/redirect", verifyWithDiscord);

export default router;
