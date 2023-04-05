// todo
import { IServerProfileModel } from "../../database/models/serverProfile";
import { Task } from "../../database/models/tasks";
import { TaskSubmission } from "../../database/models/taskSubmission";

export const executeFormTask = async (
  profile: IServerProfileModel,
  type: string,
  data: any
) => {
  const taskSubmissionCheck = await TaskSubmission.findOne({
    type: type,
    profileId: profile.id,
    organizationId: profile.organizationId,
  });
  if (taskSubmissionCheck) return false;

  const task: any = await Task.findOne({
    organizationId: profile.organizationId,
    type: type,
  });
  if (!task) return false;
  //   const user = await profile.getUser();
  await TaskSubmission.create({
    name: task.name,
    type: task.type,
    instructions: task.instruction,
    points: task.points,
    organizationId: task.organizationId,
    profileId: profile.id,
    isModeration: task.isModeration,
    uri: data.uri,
    isApproved: "pending",
  });

  return true;
};
