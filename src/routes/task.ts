import { Router } from "express";
import {
  addTask,
  deleteTask,
  allTask,
  userTasks,
  taskTypes,
} from "../controller/task";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.post("/add", ensureLoggedIn, addTask);
router.delete("/delete", ensureLoggedIn, deleteTask);
router.get("/get", ensureLoggedIn, allTask);
router.get("/userTasks", ensureLoggedIn, userTasks);
router.get("/taskType", ensureLoggedIn, taskTypes);

export default router;
