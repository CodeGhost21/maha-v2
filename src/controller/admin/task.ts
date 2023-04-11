import { Request, Response } from "express";
import { isGeneratorFunction } from "util/types";
import { Organization } from "../../database/models/organization";
import { Task, TaskTypes } from "../../database/models/tasks";

import BadRequestError from "../../errors/BadRequestError";
import NotFoundError from "../../errors/NotFoundError";
import { extractServerProfile } from "../../utils/jwt";
import { sendFeedDiscord } from "../../utils/sendFeedDiscord";

const taskTypes: TaskTypes[] = ["form", "gm", "retweet"];

export const allTasks = async (req: Request, res: Response) => {
  const profile = await extractServerProfile(req);
  const tasks = await Task.find({
    organizationId: profile.organizationId,
  });
  res.json(tasks);
};

export const addTask = async (req: Request, res: Response) => {
  const user = await extractServerProfile(req);

  const organization = await Organization.findById(user.organizationId);
  if (!organization) throw new NotFoundError("org not found");

  if (req.body.type === "gm") {
    const checkTask = await Task.findOne({
      $and: [{ organizationId: user.organizationId }, { type: req.body.type }],
    });
    if (checkTask) throw new BadRequestError("task exists");
  }
  // else {
  //   checkTask = await Task.findOne({ organizationId: user.organizationId });
  // }

  const newTask = new Task({
    name: req.body.name,
    instruction: req.body.instruction,
    type: req.body.type,
    points: req.body.points,
    organizationId: user.organizationId,
    twitterScreenName: req.body?.screenName,
    contractAddress: req.body?.contractAddress,
    isModeration: req.body?.isModeration,
    tweetLink: req.body?.tweetLink,
  });
  await newTask.save();
  if (req.body.isBroadcast)
    sendFeedDiscord(
      organization.questChannelId,
      `A new quest has been added, please check using the button below`,
      true
    );
  res.json(newTask);
};

export const deleteTask = async (req: Request, res: Response) => {
  const user = await extractServerProfile(req);
  await Task.deleteOne({
    _id: req.params.id,
    organizationId: user.organizationId,
  });
  res.json({ success: true });
};

// export const completeTask = async (
//   profile: IServerProfileModel,
//   taskType: string
// ) => {
//   const org = await Organization.findById(profile.organizationId);
//   if (!org) return;

//   const taskDetails = await Task.findOne({
//     type: taskType,
//     organizationId: org.id,
//   });

//   if (taskDetails) {
//     const newTaskSubmission = new TaskSubmission({
//       name: taskDetails.name,
//       type: taskDetails.type,
//       instruction: taskDetails.instruction,
//       points: taskDetails.points,
//       profileId: profile.id,
//       organizationId: profile.organizationId,
//     });
//     await newTaskSubmission.save();

//     const taskTotalPoints =
//       taskDetails.points * (org.maxBoost * profile.loyaltyWeight + 1);
//     profile.totalPoints += taskTotalPoints;
//     await profile.save();

//     const newPointTransaction = new PointTransaction({
//       userId: profile.id,
//       taskId: taskDetails.id,
//       type: taskDetails.type,
//       totalPoints: taskTotalPoints,
//       addPoints: taskDetails.points,
//       boost: org.maxBoost * profile.loyaltyWeight,
//       loyalty: profile.loyaltyWeight,
//     });
//     await newPointTransaction.save();

//     return true;
//   }
//   return false;
// };

// export const userTasks = async (req: Request, res: Response) => {
//   const user = req.user as IUserModel;
//   const org = await Organization.findById(user.organizationId);
//   if (!org) return;

//   if (user) {
//     const tasks = await getTasks(org.id);
//     const allTaskSubmission = await TaskSubmission.find({
//       organizationId: user.organizationId,
//       approvedBy: user.id,
//     });

//     const taskSubmittedTypes = allTaskSubmission.map(
//       (item: ITaskSubmission) => item.type
//     );
//     const completedTaskSubmission: { [task: string]: boolean } = {};
//     tasks.map((taskType: string) => {
//       if (taskSubmittedTypes.includes(taskType))
//         completedTaskSubmission[taskType] = true;
//       else completedTaskSubmission[taskType] = false;
//     });

//     res.json(completedTaskSubmission);
//   }
// };

export const types = async (req: Request, res: Response) => {
  res.json(taskTypes);
};

export const updateTask = async (req: Request, res: Response) => {
  const user = await extractServerProfile(req);

  const task = await Task.findOne({
    _id: req.params.id,
    organizationId: user.organizationId,
  });

  if (!task) throw new NotFoundError("task not found");

  task.name = req.body.name || task.name;
  task.type = req.body.type || task.type;
  task.points = req.body.points || task.points;
  task.instruction = req.body.instruction || task.instruction;
  await task.save();

  res.json({ success: true });
};
