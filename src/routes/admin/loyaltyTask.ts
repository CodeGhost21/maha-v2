import { Router } from "express";
import {
  addLoyaltyTask,
  deleteLoyaltyTask,
  allLoyaltyTask,
  userLoyaltyTask,
  types,
  updateLoyalty,
} from "../../controller/admin/loyalty";
import ensureLoggedIn from "../../middleware/ensureLoggedIn";

const router = Router();

router.get("/types", types);

router.use(ensureLoggedIn);
router.post("/", addLoyaltyTask);
router.delete("/:id", deleteLoyaltyTask);
router.get("/", allLoyaltyTask);
router.get("/user/:id", userLoyaltyTask);
router.put("/:id", updateLoyalty);

export default router;
