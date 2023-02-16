import { Router } from "express";
import { getAllProduct, getProduct } from "../controller/product";

const router = Router();

router.get("/products", getAllProduct);
router.get("/products/:productId", getProduct);

export default router;
