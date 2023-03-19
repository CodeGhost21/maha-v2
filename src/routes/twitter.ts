import { Router } from "express";
import * as Twitter from "../controller/twitter";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.get("/oauth/requestToken", Twitter.oAuthRequestToken);
router.post("/oauth/verify", Twitter.verifyAccessToken);

router.use(ensureLoggedIn);
router.get("/profile_banner", Twitter.userProfileBanner);
router.post("/logout", Twitter.twitterLogout);

export default router;
