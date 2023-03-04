import { Router } from "express";
import { twitterProfileCheck } from '../controller/loyalty'

const router = Router();

router.get("/twitterCheck", twitterProfileCheck);

export default router;
