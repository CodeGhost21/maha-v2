import { Router } from "express";

import user from "./user";
import loyalty from "./loyalty";
import organization from "./organization";
import taskSubmission from "./taskSubmission";
import task from "./task";

const router = Router();

router.use("/user", user);
router.use("/loyalty", loyalty);
router.use("/organization", organization);
router.use("/taskSubmission", taskSubmission);
router.use("/task", task);

export default router;
