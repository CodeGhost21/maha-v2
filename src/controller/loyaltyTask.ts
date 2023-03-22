import { Request, Response } from "express";
import { LoyaltyTask } from "../database/models/loyaltyTasks";
import { IUserModel, User } from "../database/models/user";

export const allLoyaltyTask = async (req: Request, res: Response) => {
  const loyaltyTasks = await LoyaltyTask.find();
  res.send(loyaltyTasks);
};

export const addLoyaltyTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id, isModerator: true });

  if (userDetails) {
    const checkLoyaltyTask = await LoyaltyTask.findOne({ name: req.body.name });
    if (!checkLoyaltyTask) {
      const newLoyaltyTask = new LoyaltyTask({
        name: req.body.name,
        type: req.body.type,
        instruction: req.body.instruction,
        weight: req.body.weight,
      });
      await newLoyaltyTask.save();
      res.send("loyalty task added");
    } else {
      res.send("already added");
    }
  } else {
    res.send("not authorized");
  }
};

export const deleteLoyaltyTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id, isModerator: true });

  if (userDetails) {
    const checkLoyaltyTask = await LoyaltyTask.findOne({ name: req.body.name });
    if (checkLoyaltyTask) {
      LoyaltyTask.deleteOne({ _id: checkLoyaltyTask._id });
      res.send("loyalty task deleted");
    }
  } else {
    res.send("not authorized");
  }
};
