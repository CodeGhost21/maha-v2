import { Request, Response } from "express";
import { ILoyaltyTask, LoyaltyTask } from "../database/models/loyaltyTasks";
import { Organization } from "../database/models/organisation";
import { ITask, Task } from "../database/models/tasks";
import { IUserModel, User } from "../database/models/user";

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
  return taskTypes;
};

export const organizationLoyaltyTask = async (organizationId: string) => {
  const allLoyaltyTask: any = await LoyaltyTask.find({
    organizationId: organizationId,
  });
  if (allLoyaltyTask.length < 0) return [];
  const loyaltyTaskTypes = allLoyaltyTask.map(
    (item: ILoyaltyTask) => item.type
  );
  return loyaltyTaskTypes;
};

export const updateOrganization = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id, isModerator: true });
  if (userDetails) {
    const org = await Organization.findOne({ _id: userDetails.organizationId });
    if (org) {
      org.maxBoost = req.body.maxBoost || org.maxBoost;
      org.guildId = req.body.guildId || org.guildId;
      await org.save();
      res.send({ success: true });
    } else {
      res.send({ success: false, msg: "organization not found" });
    }
  }
};
