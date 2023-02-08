import { Router } from "express";
import { getAllProduct, getProduct } from "../controller/product";

const router = Router();

router.get("/allProduct", (req, res) => getAllProduct(req, res));
router.post("/getProduct", (req, res) => getProduct(req, res));

export default router;
