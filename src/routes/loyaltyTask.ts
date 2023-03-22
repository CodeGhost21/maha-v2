import { Router } from "express";
import {
  addLoyaltyTask,
  deleteLoyaltyTask,
  allLoyaltyTask,
  completeLoyaltyTask,
} from "../controller/loyaltyTask";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.post("/add", ensureLoggedIn, addLoyaltyTask);
router.delete("/delete", ensureLoggedIn, deleteLoyaltyTask);
router.get("/get", allLoyaltyTask);
router.post("/completeLoyalty", ensureLoggedIn, completeLoyaltyTask);

export default router;
