import { Router } from "express";
import { allFeeds, userFeeds } from "../controller/feed";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.get("/allFeeds", allFeeds);
router.get("/userFeeds", ensureLoggedIn, userFeeds);

export default router;
