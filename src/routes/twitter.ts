import { Router } from "express";
import * as Twitter from "../controller/twitter";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.use(ensureLoggedIn);
router.get("/oauth/requestToken", Twitter.requestToken);
router.post("/oauth/verify", Twitter.verifyAccessToken);

export default router;
