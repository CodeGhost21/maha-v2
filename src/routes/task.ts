import { Router } from "express";
import {
  addTask,
  deleteTask,
  allTasks,
  userTasks,
  types,
  updateTask,
} from "../controller/admin/task";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.get("/types", types);

router.use(ensureLoggedIn);
router.post("/add", addTask);
router.delete("/delete", deleteTask);
router.get("/get", allTasks);
router.get("/userTasks", userTasks);
router.put("/update", updateTask);

export default router;
