import { Router } from "express";
import {
  addLoyaltyTask,
  deleteLoyaltyTask,
  allLoyaltyTask,
} from "../controller/loyaltyTask";

const router = Router();

router.post("/add", addLoyaltyTask);
router.delete("/delete", deleteLoyaltyTask);
router.get("/get", allLoyaltyTask);

export default router;
