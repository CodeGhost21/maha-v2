import { Router } from "express";
import {
  addLoyaltyTask,
  deleteLoyaltyTask,
  allLoyaltyTask,
  // completeLoyaltyTask,
  userLoyaltyTask,
} from "../controller/loyaltyTask";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.post("/add", ensureLoggedIn, addLoyaltyTask);
router.delete("/delete", ensureLoggedIn, deleteLoyaltyTask);
router.get("/get", ensureLoggedIn, allLoyaltyTask);
// router.post("/completeLoyalty", ensureLoggedIn, completeLoyaltyTask);
router.get("/userLoyalties", ensureLoggedIn, userLoyaltyTask);

export default router;
