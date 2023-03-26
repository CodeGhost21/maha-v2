import { Router } from "express";
import { updateOrg, getOrg } from "../../controller/admin/organization";
import ensureLoggedIn from "../../middleware/ensureLoggedIn";

const router = Router();

router.use(ensureLoggedIn);
router.put("/:orgId", updateOrg);
router.get("/:orgId", getOrg);

export default router;
