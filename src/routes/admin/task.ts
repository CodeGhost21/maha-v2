import { Router } from "express";
import * as tasks from "../../controller/admin/task";

const router = Router();
router.get("/", tasks.allTasks);
router.get("/types", tasks.types);
router.post("/", tasks.addTask);
router.delete("/:id", tasks.deleteTask);
router.put("/:id", tasks.updateTask);

export default router;
