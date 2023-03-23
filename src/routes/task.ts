import { Router } from "express";
import {
  addTask,
  deleteTask,
  allTask,
  userTasks,
  types,
  updateTask,
} from "../controller/task";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.get("/types", types);

router.use(ensureLoggedIn);
router.post("/add", addTask);
router.delete("/delete", deleteTask);
router.get("/get", allTask);
router.get("/userTasks", userTasks);
router.put("/update", updateTask);

export default router;
