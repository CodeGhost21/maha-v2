import { LoyaltyTask } from "../database/models/loyaltyTasks";
import { ITask, Task } from "../database/models/tasks";

export const getTasks = async (organizationId: string) => {
  const allTask = await Task.find({ organizationId });
  return allTask.map((item: ITask) => item.type);
};

export const getLoyaltyTasks = async (organizationId: string) => {
  const allLoyaltyTask = await LoyaltyTask.find({ organizationId });
  return allLoyaltyTask.map((item) => item.type);
};
