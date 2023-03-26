import { Router } from "express";
import * as user from "../../controller/admin/user";

const router = Router();
router.get("/", user.allUsers);
router.get("/me", user.fetchMe);

export default router;
