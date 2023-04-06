import { Router } from "express";
import * as taskSubmission from "../../controller/admin/taskSubmission";

const router = Router();
router.post("/", taskSubmission.fetchTaskSubmission);
router.put("/:id", taskSubmission.approveTask);

export default router;
