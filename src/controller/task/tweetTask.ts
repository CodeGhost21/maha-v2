// todo
import { IServerProfileModel } from "../../database/models/serverProfile";
import { ITaskModel } from "../../database/models/tasks";
import { TaskSubmission } from "../../database/models/taskSubmission";

export const executeFormTask = async (
  profile: IServerProfileModel,
  task: ITaskModel,
  data: any
) => {
  //   const user = await profile.getUser();
  await TaskSubmission.create({
    name: task.name,
    type: task.type,
    instructions: task.instruction,
    points: task.points,
    organizationId: task.organizationId,
    approvedBy: profile.id,
    isModeration: true,
    uri: data.uri,
    isApproved: "pending",
  });
};
