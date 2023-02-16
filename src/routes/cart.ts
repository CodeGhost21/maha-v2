import { Router } from "express";
import { authenticateJWT } from "../middleware/authenticateJWT";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import { addItem, removeItem, allItems, buyNow } from "../controller/cart";

const router = Router();

router.use(authenticateJWT);
router.use(ensureLoggedIn);

router.post("/item", addItem);
router.delete("/item/:id", removeItem);
router.get("/items", allItems);
router.get("/buyNow", (req, res) => buyNow(req, res));
export default router;
