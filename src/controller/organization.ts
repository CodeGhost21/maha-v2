import { Request, Response } from "express";
import { LoyaltyTask } from "../database/models/loyaltyTasks";
import { Organization } from "../database/models/organisation";
import { ITask, Task } from "../database/models/tasks";

export const addOrganization = async (req: Request, res: Response) => {
  const checkOrganization = await Organization.findOne({
    $or: [{ name: req.body.orgName }, { guildId: req.body.guildId }],
  });
  if (!checkOrganization) {
    const newOrganization = new Organization({
      name: req.body.orgName,
      guildId: req.body.guildId,
      maxBoost: req.body.maxBoost,
    });
    await newOrganization.save();
    res.send(newOrganization);
  } else {
    res.send("already added");
  }
};

export const organizationTask = async (organizationId: string) => {
  const allTask: any = await Task.find({ organizationId: organizationId });
  if (allTask.length < 0) return [];
  const taskTypes = allTask.map((item: ITask) => item.type);
  console.log(taskTypes);
  return taskTypes;
};

export const organizationLoyaltyTask = async (organizationId: string) => {
  const allLoyaltyTask = LoyaltyTask.find({ organizationId: organizationId });
  return allLoyaltyTask;
};
