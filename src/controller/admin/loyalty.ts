import { Request, Response } from "express";

import { LoyaltyTask } from "../../database/models/loyaltyTasks";
import { IServerProfileModel } from "../../database/models/serverProfile";
import { IUserModel, User } from "../../database/models/user";
import BadRequestError from "../../errors/BadRequestError";

export const allLoyaltyTask = async (req: Request, res: Response) => {
  const organizationId = req.params.orgId;
  const loyaltyTasks = await LoyaltyTask.find({ organizationId });
  res.json(loyaltyTasks);
};

export const addLoyaltyTask = async (req: Request, res: Response) => {
  const profile = req.user as IServerProfileModel;

  const checkLoyaltyTask = await LoyaltyTask.findOne({
    $and: [{ organizationId: profile.organizationId }, { type: req.body.type }],
  });

  if (checkLoyaltyTask) throw new BadRequestError("already added");

  const newLoyaltyTask = await LoyaltyTask.create({
    name: req.body.name,
    type: req.body.type,
    instruction: req.body.instruction,
    weight: req.body.weight,
    organizationId: profile.organizationId,
  });

  res.json(newLoyaltyTask);
};

export const deleteLoyaltyTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
};

export const updateLoyalty = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails: any = await User.findOne({ _id: user.id });
  if (userDetails) {
    const loyalty = await LoyaltyTask.findOne({
      _id: req.body.taskId,
      organizationId: userDetails.organizationId,
    });
    if (loyalty) {
      loyalty.name = req.body.name || loyalty.name;
      loyalty.type = req.body.type || loyalty.type;
      loyalty.weight = req.body.weight || loyalty.weight;
      loyalty.instruction = req.body.instruction || loyalty.instruction;

      await loyalty.save();
      res.json({ success: true });
    } else res.json({ success: false, message: "loyalty not found" });
  }
};
