import { Request, Response } from "express";
import {
  ILoyaltySubmission,
  LoyaltySubmission,
} from "../../database/models/loyaltySubmission";
import { LoyaltyTask } from "../../database/models/loyaltyTasks";
import { Organization } from "../../database/models/organization";
import { PointTransaction } from "../../database/models/pointTransaction";
import { IUserModel, User } from "../../database/models/user";
import { getLoyaltyTasks } from "./organization";

const loyaltyTypes = ["twitter_profile", "discord_profile"];

export const allLoyaltyTask = async (req: Request, res: Response) => {
  const organizationId = req.params.orgId;
  const loyaltyTasks = await LoyaltyTask.find({ organizationId });
  res.json(loyaltyTasks);
};

export const addLoyaltyTask = async (req: Request, res: Response) => {
  console.log(req.body);

  const user = req.user as IUserModel;
  const userDetails = await User.findOne({ _id: user.id, isModerator: true });
  if (userDetails) {
    const checkLoyaltyTask = await LoyaltyTask.findOne({
      $and: [
        { organizationId: userDetails.organizationId },
        { type: req.body.type },
      ],
    });
    if (!checkLoyaltyTask) {
      const newLoyaltyTask = new LoyaltyTask({
        name: req.body.name,
        type: req.body.type,
        instruction: req.body.instruction,
        weight: req.body.weight,
        organizationId: userDetails.organizationId,
      });
      await newLoyaltyTask.save();
      res.send(newLoyaltyTask);
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
    const checkLoyaltyTask = await LoyaltyTask.findOne({
      _id: req.body.taskId,
    });
    if (checkLoyaltyTask) {
      await LoyaltyTask.deleteOne({ _id: checkLoyaltyTask._id });
      res.send({ success: true });
    }
  } else {
    res.send({ success: false });
  }
};

export const completeLoyaltyTask = async (
  userDiscordId: string,
  type: string
) => {
  const userDetails = await User.findOne({ userID: userDiscordId });
  if (userDetails) {
    const checkLoyaltySubmission = await LoyaltySubmission.findOne({
      type: type,
      approvedBy: userDetails.id,
      organizationId: userDetails.organizationId,
    });
    if (!checkLoyaltySubmission) {
      const verifyLoyalty = await checkLoyalty(userDetails, type);
      if (verifyLoyalty) {
        const organizationDetails: any = await Organization.findOne({
          _id: userDetails.organizationId,
        });
        const fetchLoyaltyTask: any = await LoyaltyTask.findOne({
          organizationId: userDetails.organizationId,
          type: type,
        });
        const newLoyaltySubmission = new LoyaltySubmission({
          approvedBy: userDetails.id,
          organizationId: organizationDetails.id,
          type: fetchLoyaltyTask.type,
          totalWeight: fetchLoyaltyTask.weight,
          boost: organizationDetails.maxBoost * userDetails.loyaltyWeight,
          loyalty: userDetails.loyaltyWeight,
        });

        await newLoyaltySubmission.save();
        const totalLoyaltyWeight =
          userDetails.loyaltyWeight + fetchLoyaltyTask.weight;

        userDetails.loyaltyWeight = totalLoyaltyWeight;
        await userDetails.save();

        const newPointTransaction = new PointTransaction({
          userId: userDetails.id,
          taskId: fetchLoyaltyTask.id,
          type: fetchLoyaltyTask.type,
          totalPoints: totalLoyaltyWeight,
          addPoints: fetchLoyaltyTask.weight,
          boost: organizationDetails.maxBoost * userDetails.loyaltyWeight,
          loyalty: userDetails.loyaltyWeight,
        });
        await newPointTransaction.save();

        // res.send("done");
        return "Task completed successfully.";
      }
      return "Task failed. Please check if you have completed the task.";
    }
    return "You have already completed this task";
  }
  return "Something went wrong. Please try again.";
};

export const userLoyaltyTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userDetails: any = await User.findOne({ _id: user.id });
  const organizationDetails: any = await Organization.findOne({
    _id: userDetails.organizationId,
  });
  if (userDetails) {
    const loyaltyTasks = await getLoyaltyTasks(organizationDetails.id);
    const allLoyaltySubmission = await LoyaltySubmission.find({
      organizationId: userDetails.organizationId,
      approvedBy: userDetails.id,
    });

    const loyaltySubmittedTypes = allLoyaltySubmission.map(
      (item: ILoyaltySubmission) => item.type
    );
    const completedLoyaltySubmission: any = {};
    loyaltyTasks.map((taskType: string) => {
      if (loyaltySubmittedTypes.includes(taskType))
        completedLoyaltySubmission[taskType] = true;
      else completedLoyaltySubmission[taskType] = false;
    });

    res.send(completedLoyaltySubmission);
  }
};

export const types = async (req: Request, res: Response) => {
  res.send(loyaltyTypes);
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
      res.send({ success: true });
    } else res.send({ success: false, message: "loyalty not found" });
  }
};
