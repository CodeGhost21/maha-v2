import { Request, Response } from "express";
import {
  ILoyaltySubmission,
  LoyaltySubmission,
} from "../../database/models/loyaltySubmission";
import { LoyaltyTask } from "../../database/models/loyaltyTasks";
import { Organization } from "../../database/models/organization";
import { PointTransaction } from "../../database/models/pointTransaction";
import { IUserModel, User } from "../../database/models/user";
import { fetchTwitterProfile } from "../user";
import { getLoyaltyTasks } from "../admin/organization";
import { profileImageComparing } from "../../utils/image";
import {
  IServerProfile,
  ServerProfile,
} from "../../database/models/serverProfile";
import NotFoundError from "../../errors/NotFoundError";

const loyaltyTypes = ["twitter_profile", "discord_profile"];

const checkLoyalty = async (profile: IServerProfile, loyaltyType: string) => {
  if (loyaltyType === "gm") {
    if (profile.totalGMs > 0) return true;
  } else if (loyaltyType === "twitter_profile") {
    const user = await profile.getUser();

    const twitterProfile = await fetchTwitterProfile(user);
    const twitterCheck = await profileImageComparing(
      twitterProfile,
      48,
      user.walletAddress
    );
    return twitterCheck;
  }
  return false;
};

export const completeLoyaltyTask = async (
  userId: string,
  organizationId: string,
  type: string
) => {
  const profile = await ServerProfile.findOne({ userId, organizationId });

  const loyaltyTask = await LoyaltyTask.findOne({
    organizationId,
    type,
  });

  if (!profile) throw new NotFoundError("profile not found");
  if (!loyaltyTask) throw new NotFoundError("loyaltyTask not found");

  const checkLoyaltySubmission = await LoyaltySubmission.findOne({
    type: type,
    approvedBy: profile.id,
    organizationId: profile.organizationId,
  });

  // task already completed
  if (checkLoyaltySubmission) return true;

  const verifyLoyalty = await checkLoyalty(profile, type);
  if (!verifyLoyalty) return false;

  const organization = await Organization.findById(organizationId);
  if (!organization) throw new NotFoundError("organization not found");

  await LoyaltySubmission.create({
    profile,
    organizationId: organization.id,
    type: loyaltyTask.type,
    totalWeight: loyaltyTask.weight,
    boost: organization.maxBoost * profile.loyaltyWeight,
    loyalty: profile.loyaltyWeight,
  });

  // recalculate profile loyalty weight
  const totalLoyaltyWeight = profile.loyaltyWeight + loyaltyTask.weight;
  profile.loyaltyWeight = totalLoyaltyWeight;
  await profile.save();

  await PointTransaction.create({
    userId: profile.id,
    taskId: loyaltyTask.id,
    type: loyaltyTask.type,
    totalPoints: totalLoyaltyWeight,
    addPoints: loyaltyTask.weight,
    boost: organization.maxBoost * profile.loyaltyWeight,
    loyalty: profile.loyaltyWeight,
  });
};

export const userLoyaltyTask = async (req: Request, res: Response) => {};

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
