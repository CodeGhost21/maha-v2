import { Request, Response } from "express";
import { ITaskModel, Task } from "../database/models/tasks";
import { IUserModel, User } from "../database/models/user";
import {
  ITaskSubmission,
  TaskSubmission,
} from "../database/models/taskSubmmission";
import { PointTransaction } from "../database/models/pointTransaction";
import { sendFeedDiscord } from "../utils/sendFeedDiscord";
import { Organization } from "../database/models/organisation";
import { organizationTask } from "./organization";

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
  const userDetails: any = await User.findOne({ _id: user.id });
  const organizationDetails: any = await Organization.findOne({
    _id: userDetails.organizationId,
  });
  const taskDetails = await Task.findOne({
    type: taskType,
    organizationId: organizationDetails.id,
  });

  if (taskDetails) {
    const newTaskSubmission = new TaskSubmission({
      name: taskDetails.name,
      type: taskDetails.type,
      instruction: taskDetails.instruction,
      points: taskDetails.points,
      approvedBy: userDetails.id,
      organizationId: userDetails.organizationId,
    });
    await newTaskSubmission.save();

    const taskTotalPoints =
      taskDetails.points *
      (organizationDetails.maxBoost * userDetails.loyaltyWeight + 1);
    userDetails.totalPoints += taskTotalPoints;
    await userDetails.save();

    const newPointTransaction = new PointTransaction({
      userId: userDetails.id,
      taskId: taskDetails.id,
      type: taskDetails.type,
      totalPoints: taskTotalPoints,
      addPoints: taskDetails.points,
      boost: organizationDetails.maxBoost * userDetails.loyaltyWeight,
      loyalty: userDetails.loyaltyWeight,
    });
    await newPointTransaction.save();

    await sendFeedDiscord(
      `${userDetails.discordName} has completed ${taskDetails.name} `
    );
  }
};

export const userTasks = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails: any = await User.findOne({ _id: user.id });
  const organizationDetails: any = await Organization.findOne({
    _id: userDetails.organizationId,
  });
  if (userDetails) {
    const tasks = await organizationTask(organizationDetails.id);
    const allTaskSubmission = await TaskSubmission.find({
      organizationId: userDetails.organizationId,
      approvedBy: userDetails.id,
    });

    const taskSubmittedTypes = allTaskSubmission.map(
      (item: ITaskSubmission) => item.type
    );
    let completedTaskSubmission: any = {};
    tasks.map((taskType: string) => {
      if (taskSubmittedTypes.includes(taskType))
        completedTaskSubmission[taskType] = true;
      else completedTaskSubmission[taskType] = false;
    });

    res.send(completedTaskSubmission);
  }
};

export const taskTypes = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails: any = await User.findOne({ _id: user.id });
  if (userDetails) {
    let allTypes: any = await Task.find({
      organizationId: userDetails.organizationId,
    });

    allTypes = allTypes.map((i: ITaskModel) => i.type);
    res.send(allTypes);
  }
};
