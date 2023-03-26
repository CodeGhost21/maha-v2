import { Router } from "express";

import user from "./user";
import login from "./login";
import loyalty from "./loyalty";
import organization from "./organization";

import task from "./task";
import ensureLoggedIn from "../../middleware/ensureLoggedIn";

const router = Router();

router.use("/login", login);

router.use(ensureLoggedIn);

router.use("/user", user);
router.use("/loyalty", loyalty);
router.use("/organization", organization);
router.use("/task", task);

export default router;
