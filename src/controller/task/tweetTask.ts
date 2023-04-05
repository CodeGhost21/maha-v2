// todo
import { IServerProfileModel } from "../../database/models/serverProfile";
import { ITaskModel, Task } from "../../database/models/tasks";
import { TaskSubmission } from "../../database/models/taskSubmission";

export const executeFormTask = async (
  profile: IServerProfileModel,
  type: string,
  data: any
) => {
  const taskSubmissionCheck = await TaskSubmission.findOne({ type: type, profileId: profile.id, organizationId: profile.organizationId })
  if (taskSubmissionCheck) {
    taskSubmissionCheck.uri = data.uri
    taskSubmissionCheck.isApproved = "pending";

    await taskSubmissionCheck.save();
  }


  const task: any = await Task.findOne({ organizationId: profile.organizationId, type: type })
  if (!task) return false;
  //   const user = await profile.getUser();
  await TaskSubmission.create({
    name: task.name,
    type: task.type,
    instructions: task.instruction,
    points: task.points,
    organizationId: task.organizationId,
    profileId: profile.id,
    isModeration: true,
    uri: data.uri,
    isApproved: "pending",
  });

  return true;
};
