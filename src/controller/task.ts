import { Request, Response } from "express";
import { Task } from "../database/models/tasks";

export const allTask = async (req: Request, res: Response) => {
  const tasks = await Task.find();
  res.send(tasks);
};

export const addTask = async (req: Request, res: Response) => {
  const checkTask = await Task.findOne({ name: req.body.name });
  if (!checkTask) {
    const newTask = new Task({
      name: req.body.name,
      instructions: req.body.instructions,
      type: req.body.type,
      points: req.body.points,
    });

    await newTask.save();
    res.send(newTask);
  } else {
    res.send("task already existing");
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  const checkTask = await Task.findOne({ name: req.body.name });
  if (checkTask) {
    Task.deleteOne({ _id: checkTask._id });
    res.send("task deleted");
  }
};
