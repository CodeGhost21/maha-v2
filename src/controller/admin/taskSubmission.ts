import { Request, Response } from "express";
import BadRequestError from "../../errors/BadRequestError";
import NotFoundError from "../../errors/NotFoundError";
import { Organization } from "../../database/models/organization";
import { PointTransaction } from "../../database/models/pointTransaction";
import { ServerProfile } from "../../database/models/serverProfile";
import { Task } from "../../database/models/tasks";
import { TaskSubmission } from "../../database/models/taskSubmission";
import { calculateBoost } from "../../utils/boost";
import { extractServerProfile } from "../../utils/jwt";
import { sendFeedDiscord } from "../../utils/sendFeedDiscord";

export const approveTask = async (req: Request, res: Response) => {
  const profile = await extractServerProfile(req);
  const user = await profile.getUser();

  const taskSubmission = await TaskSubmission.findOne({
    _id: req.params.id,
    organizationId: profile.organizationId,
  });

  if (taskSubmission) {
    const taskUser = await ServerProfile.findOne({
      _id: taskSubmission.profileId,
    });

    if (!taskUser) throw new BadRequestError("user not found");

    taskSubmission.isApproved = req.body.isApproved;
    taskSubmission.approvedBy = profile.id;
    await taskSubmission.save();

    const organization = await Organization.findById(taskUser.organizationId);

    if (!organization) throw new NotFoundError("org not found");

    if (req.body.isApproved === "approved") {
      const boost = calculateBoost(
        taskUser.loyaltyWeight,
        organization.maxBoost
      );

      const task = await Task.findOne({
        organizationId: taskUser.organizationId,
        type: taskSubmission.type,
      });

      if (!task) throw new BadRequestError("task not found");

      const points = task.points * boost;
      taskUser.totalPoints += points;
      await taskUser.save();

      await PointTransaction.create({
        userId: taskUser.id,
        taskId: task.id,
        type: task.type,
        totalPoints: taskUser.totalPoints,
        addPoints: points,
        boost: organization.maxBoost * taskUser.loyaltyWeight,
        loyalty: taskUser.loyaltyWeight,
      });

      sendFeedDiscord(
        organization.feedChannelId,
        `<@${user.discordId}> has just completed their tweet task and have earned ${task.points} points.`
      );

      res.json({ success: true });
    } else if (req.body.isApproved === "rejected") {
      taskSubmission.isApproved = req.body.isApproved;
      await taskSubmission.save();

      sendFeedDiscord(
        organization.feedChannelId,
        `<@${user.discordId}> your task was rejected. Please try again!`
      );

      res.json({ success: true });
    }
  }
};

export const fetchTaskSubmission = async (req: Request, res: Response) => {
  const profile = await extractServerProfile(req);

  const fetchTask = await Task.findOne({ _id: req.body.taskId });

  if (fetchTask) {
    const allTaskSubmissions = await TaskSubmission.find({
      type: fetchTask.type,
      organizationId: profile.organizationId,
      isModeration: true,
    }).populate({
      path: "profileId",
      select: "userId",
      populate: { path: "userId", select: "discordName " },
    });
    res.json(allTaskSubmissions);
  } else {
    res.json("Invalid task");
  }
};
