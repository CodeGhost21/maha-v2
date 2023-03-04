import { Router } from "express";
import { checkTask } from "../controller/loyalty";
import { authenticateJWT } from "../middleware/authenticateJWT";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.use(authenticateJWT);
router.use(ensureLoggedIn);
router.post("/checkTask", checkTask);

export default router;
