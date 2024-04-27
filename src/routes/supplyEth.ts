import { Router } from "express";
import { getUsersSupply } from "../controller/supplyEthereum";
import ensureLoggedIn from "../middleware/ensureLoggedIn";
import deserializeUser from "../middleware/deserializeUser";

const router = Router();

router.get("/EthereumLrtRsETH", getUsersSupply);

// router.use(deserializeUser, ensureLoggedIn);
// router.post("/register", registerUser);

export default router;
