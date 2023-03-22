import { Router } from "express";
import { addTask, deleteTask, allTask } from "../controller/task";

const router = Router();

router.post("/add", addTask);
router.delete("/delete", deleteTask);
router.get("/get", allTask);

export default router;
