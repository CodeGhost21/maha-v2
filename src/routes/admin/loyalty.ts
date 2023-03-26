import { Router } from "express";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import { getLoyalty } from "../controller/loyalty";

const router = Router();

router.use(ensureLoggedIn);
router.get("/:org", getLoyalty);
export default router;
