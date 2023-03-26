import { Router } from "express";
import { addOrg, updateOrg, getOrg } from "../controller/admin/organization";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.post("/add", addOrg);
router.put("/update", ensureLoggedIn, updateOrg);
router.get("/get", ensureLoggedIn, getOrg);

export default router;
