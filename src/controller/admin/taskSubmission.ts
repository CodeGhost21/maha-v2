import { Request, Response } from "express";
import { Organization } from "../../database/models/organization";
import { PointTransaction } from "../../database/models/pointTransaction";
import { ServerProfile } from "../../database/models/serverProfile";
import { Task } from "../../database/models/tasks";
import { TaskSubmission } from "../../database/models/taskSubmission";
import { calculateBoost } from "../../utils/boost";
import { extractServerProfile } from "../../utils/jwt";

export const approveTask = async (req: Request, res: Response) => {
  const profile = await extractServerProfile(req);

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

    if (req.body.isApproved === "approved") {
      const organization: any = await Organization.findById(
        taskUser.organizationId
      );
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
    } else if (req.body.isApproved === "rejected") {
      TaskSubmission.deleteOne({ _id: taskSubmission.id });
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
