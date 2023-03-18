import { Router } from "express";
import * as Twitter from "../controller/twitter";
import { authenticateJWT } from "../middleware/authenticateJWT";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.get("/oauth/request_token", async (req, res) =>
  Twitter.oAuthRequestToken(req, res)
);
router.post("/oauth/access_token", async (req, res) =>
  Twitter.oAuthAccessToken(req, res)
);
router.use(authenticateJWT);
router.use(ensureLoggedIn);
router.get("/profile_banner", async (req, res) =>
  Twitter.userProfileBanner(req, res)
);
router.post("/logout", async (req, res) => Twitter.twitterLogout(req, res));

export default router;
