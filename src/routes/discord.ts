import { Router } from "express";
import { registerUser, requestToken } from "../controller/discord";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import deserializeUser from "../middleware/deserializeUser";

const router = Router();

router.get("/redirect", requestToken);

router.use(deserializeUser, ensureLoggedIn);
router.post("/register", registerUser);

export default router;
