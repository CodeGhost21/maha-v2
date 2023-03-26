import { Router } from "express";
import * as loyalty from "../../controller/admin/loyalty";

const router = Router();
router.get("/", loyalty.allLoyaltyTask);
router.put("/:id", loyalty.updateLoyalty);
router.post("/", loyalty.addLoyaltyTask);
router.delete("/:id", loyalty.deleteLoyaltyTask);

export default router;
