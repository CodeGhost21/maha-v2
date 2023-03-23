import { Request, Response } from "express";
import { Task } from "../database/models/tasks";
import { IUserModel, User } from "../database/models/user";
import { TaskSubmission } from "../database/models/taskSubmmission";
import { PointTransaction } from "../database/models/pointTransaction";
import { saveFeed } from "../utils/saveFeed";
import { Organization } from "../database/models/organisation";

export const allTask = async (req: Request, res: Response) => {
  const tasks = await Task.find();
  res.send(tasks);
};

export const addTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id, isModerator: true });
  if (userDetails) {
    const checkTask = await Task.findOne({ name: req.body.name });
    if (!checkTask) {
      const newTask = new Task({
        name: req.body.name,
        instructions: req.body.instructions,
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
    const checkTask = await Task.findOne({ name: req.body.name });
    if (checkTask) {
      Task.deleteOne({ _id: checkTask._id });
      res.send("task deleted");
    }
  } else {
    res.send("not authorized");
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
      instruction: taskDetails.instructions,
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

    await saveFeed(userDetails, "task", taskDetails.name, taskDetails.points);
  }
};

export const userTasks = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id });
  if (userDetails) {
    const allTask = await TaskSubmission.find({
      organizationId: userDetails.organizationId,
      approvedBy: userDetails.id,
    });

    console.log(allTask);
    res.send(allTask);
  }
};
