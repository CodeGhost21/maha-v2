import { Organization } from "../../database/models/organization";
import { PointTransaction } from "../../database/models/pointTransaction";
import { IServerProfileModel } from "../../database/models/serverProfile";
import { Task, TaskTypes } from "../../database/models/tasks";
import { TaskSubmission } from "../../database/models/taskSubmission";
import NotFoundError from "../../errors/NotFoundError";
import { calculateBoost } from "../../utils/boost";

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

  const organization = await Organization.findById(profile.organizationId);
  if (!organization) throw new NotFoundError("organization not found");

  const boost = calculateBoost(profile.loyaltyWeight, organization.maxBoost);

  await TaskSubmission.create({
    profileId: profile.id,
    organizationId: organization.id,
    type: task.type,
    points: task.points,
    boost,
    loyalty: profile.loyaltyWeight,
  });

  // calculate points after boost
  const points = task.points * boost;
  profile.totalPoints += points;
  await profile.save();

  // record in the DB
  await PointTransaction.create({
    userId: profile.id,
    taskId: task.id,
    type: task.type,
    totalPoints: profile.totalPoints,
    addPoints: points,
    boost: organization.maxBoost * profile.loyaltyWeight,
    loyalty: profile.loyaltyWeight,
  });

  return true;
};
