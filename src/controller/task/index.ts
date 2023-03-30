import { Organization } from "../../database/models/organization";
import { PointTransaction } from "../../database/models/pointTransaction";
import { IServerProfileModel } from "../../database/models/serverProfile";
import { Task, TaskTypes } from "../../database/models/tasks";
import { TaskSubmission } from "../../database/models/taskSubmission";
import NotFoundError from "../../errors/NotFoundError";

export const completeTask = async (
  profile: IServerProfileModel,
  type: TaskTypes
) => {
  const task = await Task.findOne({
    organizationId: profile.organizationId,
    type,
  });

  if (!profile) throw new NotFoundError("profile not found");

  if (!task) return false;

  const checkTaskSubmission = await TaskSubmission.findOne({
    type: type,
    approvedBy: profile.id,
    organizationId: profile.organizationId,
  });

  if (checkTaskSubmission) return true;

  //   const verifyLoyalty = await checkLoyalty(profile, type);
  //   if (!verifyLoyalty) return false;

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

  // recalculate profile total  points
  const totalPoints =
    task.points * (organization.maxBoost * profile.loyaltyWeight + 1);
  profile.totalPoints += totalPoints;
  await profile.save();

  await PointTransaction.create({
    userId: profile.id,
    taskId: task.id,
    type: task.type,
    totalPoints: profile.totalPoints,
    addPoints: totalPoints,
    boost: organization.maxBoost * profile.loyaltyWeight,
    loyalty: profile.loyaltyWeight,
  });

  return true;
};
