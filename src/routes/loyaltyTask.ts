import { Router } from "express";
import {
  addLoyaltyTask,
  deleteLoyaltyTask,
  allLoyaltyTask,
  completeLoyaltyTask,
  userLoyaltyTask,
  types,
  updateLoyalty,
} from "../controller/loyaltyTask";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.get("/types", types);

router.use(ensureLoggedIn);
router.post("/add", addLoyaltyTask);
router.delete("/delete", deleteLoyaltyTask);
router.get("/get", allLoyaltyTask);
router.post("/completeLoyalty", completeLoyaltyTask);
router.get("/userLoyalties", userLoyaltyTask);
router.put("/update", updateLoyalty);

export default router;
