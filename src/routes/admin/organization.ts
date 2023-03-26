import { Router } from "express";
import * as organization from "../../controller/admin/organization";

const router = Router();
router.get("/", organization.getOrg);
router.put("/", organization.updateOrg);

export default router;
