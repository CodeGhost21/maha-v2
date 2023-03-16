import { Router } from "express";
import { allFeeds, userFeeds } from "../controller/feed";
import { authenticateJWT } from "../middleware/authenticateJWT";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.get("/allFeeds", allFeeds);

router.use(authenticateJWT);
router.use(ensureLoggedIn);
router.get("/userFeeds", userFeeds);

export default router;
