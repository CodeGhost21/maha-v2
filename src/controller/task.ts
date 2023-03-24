import { Request, Response } from "express";
import { Task } from "../database/models/tasks";
import { IUserModel, User } from "../database/models/user";
import {
  ITaskSubmission,
  TaskSubmission,
} from "../database/models/taskSubmmission";
import { PointTransaction } from "../database/models/pointTransaction";
import { sendFeedDiscord } from "../utils/sendFeedDiscord";
import { Organization } from "../database/models/organisation";
import { organizationTask } from "./organization";

const taskTypes = ["gm", "hold_nft", "follow_twitter"];

export const allTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id, isModerator: true });
  if (userDetails) {
    const tasks = await Task.find({
      organizationId: userDetails.organizationId,
    });
    res.send(tasks);
  }
};

export const addTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id, isModerator: true });
  if (userDetails) {
    const checkTask = await Task.findOne({
      $or: [{ name: req.body.name }, { type: req.body.type }],
    });
    if (!checkTask) {
      const newTask = new Task({
        name: req.body.name,
        instruction: req.body.instruction,
        type: req.body.type,
        points: req.body.points,
        organizationId: userDetails.organizationId,
      });
      await newTask.save();
      res.send(newTask);
    } else {
      res.send("task already existing");
    }
  } else {
    res.send("not authorized");
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id, isModerator: true });
  if (userDetails) {
    const checkTask = await Task.findOne({ _id: req.body.taskId });
    if (checkTask) {
      await Task.deleteOne({ _id: checkTask.id });
      res.send({ success: true });
    }
  } else {
    res.send({ success: false });
  }
};

export const completeTask = async (user: IUserModel, taskType: string) => {
  const org = await Organization.findById(user.organizationId);
  if (!org) return;

  const taskDetails = await Task.findOne({
    type: taskType,
    organizationId: org.id,
  });

  if (taskDetails) {
    const newTaskSubmission = new TaskSubmission({
      name: taskDetails.name,
      type: taskDetails.type,
      instruction: taskDetails.instruction,
      points: taskDetails.points,
      approvedBy: user.id,
      organizationId: user.organizationId,
    });
    await newTaskSubmission.save();

    const taskTotalPoints =
      taskDetails.points * (org.maxBoost * user.loyaltyWeight + 1);
    user.totalPoints += taskTotalPoints;
    await user.save();

    const newPointTransaction = new PointTransaction({
      userId: user.id,
      taskId: taskDetails.id,
      type: taskDetails.type,
      totalPoints: taskTotalPoints,
      addPoints: taskDetails.points,
      boost: org.maxBoost * user.loyaltyWeight,
      loyalty: user.loyaltyWeight,
    });
    await newPointTransaction.save();

    await sendFeedDiscord(
      `${user.discordName} has completed ${taskDetails.name} `
    );
  }
};

export const userTasks = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const org = await Organization.findById(user.organizationId);
  if (!org) return;

  if (user) {
    const tasks = await organizationTask(org.id);
    const allTaskSubmission = await TaskSubmission.find({
      organizationId: user.organizationId,
      approvedBy: user.id,
    });

    const taskSubmittedTypes = allTaskSubmission.map(
      (item: ITaskSubmission) => item.type
    );
    const completedTaskSubmission: { [task: string]: boolean } = {};
    tasks.map((taskType: string) => {
      if (taskSubmittedTypes.includes(taskType))
        completedTaskSubmission[taskType] = true;
      else completedTaskSubmission[taskType] = false;
    });

    res.send(completedTaskSubmission);
  }
};

export const types = async (req: Request, res: Response) => {
  res.send(taskTypes);
};

export const updateTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id });
  if (userDetails) {
    const task = await Task.findOne({
      _id: req.body.taskId,
      organizationId: userDetails.organizationId,
    });
    console.log(task);

    if (task) {
      task.name = req.body.name || task.name;
      task.type = req.body.type || task.type;
      task.points = req.body.points || task.points;
      task.instruction = req.body.instruction || task.instruction;

      await task.save();

      res.send({ success: true });
    } else res.send({ success: false, message: "task not found" });
  }
};
