import { Router } from "express";
import { authenticateJWT } from "../middleware/authenticateJWT";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import { checkTask, getLoyalty } from "../controller/loyalty";

const router = Router();

router.use(authenticateJWT);
router.use(ensureLoggedIn);
router.post("/checkTask", checkTask);
router.get("/getLoyalty", getLoyalty);
export default router;
