import { Router } from "express";
import { getBlastUser } from "../controller/blastUser";

const router = Router();

router.get("/", getBlastUser);

export default router;
