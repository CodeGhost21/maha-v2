import { Router } from "express";
import { authenticateJWT } from "../middleware/authenticateJWT";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import { addItem, removeItem, allItems, buyNow } from "../controller/cart";

const router = Router();

router.use(authenticateJWT);
router.use(ensureLoggedIn);
router.post("/addItem", (req, res) => addItem(req, res));
router.post("/removeItem", (req, res) => removeItem(req, res));
router.get("/fetchItems", (req, res) => allItems(req, res));
router.get("/buyNow", (req, res) => buyNow(req, res));
export default router;
