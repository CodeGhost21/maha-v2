import { Router } from "express";
import { addTask, deleteTask, allTask } from "../controller/task";
import ensureLoggedIn from "../middleware/ensureLoggedIn";

const router = Router();

router.post("/add", ensureLoggedIn, addTask);
router.delete("/delete", ensureLoggedIn, deleteTask);
router.get("/get", allTask);

export default router;
