import { Router } from "express";
import { getProofs } from "../controller/merkleProof";

const router = Router();

router.get("/", getProofs);

export default router;
