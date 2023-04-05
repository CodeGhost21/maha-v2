import { Request, Response } from "express";
import { Organization } from "../../database/models/organization";
import { PointTransaction } from "../../database/models/pointTransaction";
import { Task } from "../../database/models/tasks";
import { TaskSubmission } from "../../database/models/taskSubmission";
import { calculateBoost } from "../../utils/boost";
import { extractServerProfile } from "../../utils/jwt";

export const approveTask = async (req: Request, res: Response) => {
  const user = await extractServerProfile(req);

  const taskSubmission = await TaskSubmission.findOne({
    _id: req.body.id,
    organizationId: user.organizationId,
  });

  if (taskSubmission) {
    taskSubmission.isApproved = req.body.isApproved;
    await taskSubmission.save();

    if (req.body.isApproved === "approved") {
      const organization: any = await Organization.findById(
        user.organizationId
      );
      const boost = calculateBoost(user.loyaltyWeight, organization.maxBoost);

      const task: any = await Task.findOne({
        organizationId: user.organizationId,
        type: taskSubmission.type,
      });

      const points = task.points * boost;
      user.totalPoints += points;
      await user.save();

      await PointTransaction.create({
        userId: user.id,
        taskId: task.id,
        type: task.type,
        totalPoints: user.totalPoints,
        addPoints: points,
        boost: organization.maxBoost * user.loyaltyWeight,
        loyalty: user.loyaltyWeight,
      });
    }
  }
};
