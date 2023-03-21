import { Router } from "express";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import { checkLoyaltyTask, getLoyalty } from "../controller/loyalty";

const router = Router();

router.use(ensureLoggedIn);
router.post("/checkTask", checkLoyaltyTask);
router.get("/getLoyalty", getLoyalty);
export default router;
