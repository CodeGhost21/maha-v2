import { IServerProfileModel } from "../../database/models/serverProfile";
import { Task } from "../../database/models/tasks";
import { PointTransaction } from "../../database/models/pointTransaction";
import { Organization } from "../../database/models/organization";
import { TaskSubmission } from "../../database/models/taskSubmmission";
import NotFoundError from "../../errors/NotFoundError";

export const completeTask = async (
  profile: IServerProfileModel,
  type: string
) => {
  const task = await Task.findOne({
    organizationId: profile.organizationId,
    type,
  });

  if (!task) return true;

  const organization = await Organization.findById(profile.organizationId);
  if (!organization) throw new NotFoundError("organization not found");

  await TaskSubmission.create({
    profileId: profile.id,
    organizationId: organization.id,
    type: task.type,
    points: task.points,
    boost: organization.maxBoost * profile.loyaltyWeight,
    loyalty: profile.loyaltyWeight,
  });

  const totalTaskPoints = task.points * (profile.loyaltyWeight + 1);
  profile.totalPoints += totalTaskPoints;
  await profile.save();

  await PointTransaction.create({
    userId: profile.id,
    taskId: task.id,
    type: task.type,
    totalPoints: profile.totalPoints,
    addPoints: totalTaskPoints,
    boost: organization.maxBoost * profile.loyaltyWeight,
    loyalty: profile.loyaltyWeight,
  });

  return true;
};
