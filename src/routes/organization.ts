import { Router } from "express";
import { addOrganization } from "../controller/organization";

const router = Router();

router.post("/add", addOrganization);

export default router;
