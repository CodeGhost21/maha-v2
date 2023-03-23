import { Router } from "express";
import {
  addTask,
  deleteTask,
  allTask,
  completeTask,
  userTasks,
} from "../controller/task";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.post("/add", ensureLoggedIn, addTask);
router.delete("/delete", ensureLoggedIn, deleteTask);
router.get("/get", ensureLoggedIn, allTask);
// router.post("/completeTask", ensureLoggedIn, completeTask);
router.get("/userTasks", ensureLoggedIn, userTasks);

export default router;
