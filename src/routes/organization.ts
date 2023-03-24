import { Router } from "express";
import {
  addOrganization,
  updateOrganization,
} from "../controller/organization";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.post("/add", addOrganization);
router.put("/update", ensureLoggedIn, updateOrganization);

export default router;
