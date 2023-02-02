import { Router } from "express";
import { getMarketPlaceData } from "../controller/marketPlace";

const router = Router();

router.get("/", (req, res) => getMarketPlaceData(req, res));

export default router;
