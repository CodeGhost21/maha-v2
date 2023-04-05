import { Request, Response } from "express";
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
    const taskUser: any = await ServerProfile.findOne({
      _id: taskSubmission.profileId,
    });
    taskSubmission.isApproved = req.body.isApproved;
    taskSubmission.approvedBy = profile.id;
    await taskSubmission.save();

    const organization: any = await Organization.findById(
      taskUser.organizationId
    );
    if (req.body.isApproved === "approved") {
      const boost = calculateBoost(
        taskUser.loyaltyWeight,
        organization.maxBoost
      );

      const task: any = await Task.findOne({
        organizationId: taskUser.organizationId,
        type: taskSubmission.type,
      });

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
      console.log(user.discordId)

      sendFeedDiscord(
        organization.feedChannelId,
        `<@${user.discordId}> has just completed their tweet task.`
      );

      res.json({ success: true })
    } else if (req.body.isApproved === "rejected") {
      TaskSubmission.deleteOne({ _id: taskSubmission.id });

      sendFeedDiscord(
        organization.feedChannelId,
        `<@${user.discordId}> your task was rejected. Please try again!`
      );

      res.json({ success: true })

    }
  }
};

export const fetchTaskSubmission = async (req: Request, res: Response) => {
  const profile = await extractServerProfile(req);

  const allTaskSubmissions = await TaskSubmission.find({
    organizationId: profile.organizationId,
    isModeration: true,
  }).populate({
    path: "profileId",
    select: "userId",
    populate: { path: "userId", select: "discordName " },
  });
  res.json(allTaskSubmissions);
};
