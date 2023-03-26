import { LoyaltySubmission } from "../../database/models/loyaltySubmission";
import {
  LoyaltyTask,
  LoyaltyTaskType,
} from "../../database/models/loyaltyTasks";
import { Organization } from "../../database/models/organization";
import { PointTransaction } from "../../database/models/pointTransaction";
import { fetchTwitterProfile } from "../user";
import { profileImageComparing } from "../../utils/image";
import {
  IServerProfile,
  IServerProfileModel,
} from "../../database/models/serverProfile";
import NotFoundError from "../../errors/NotFoundError";

export const checkLoyalty = async (
  profile: IServerProfile,
  loyaltyType: string
) => {
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
  profile: IServerProfileModel,
  type: LoyaltyTaskType
) => {
  const loyaltyTask = await LoyaltyTask.findOne({
    organizationId: profile.organizationId,
    type,
  });

  if (!profile) throw new NotFoundError("profile not found");

  // if there was no loyalty task here; then we skip. no points given
  if (!loyaltyTask) return true;

  const checkLoyaltySubmission = await LoyaltySubmission.findOne({
    type: type,
    approvedBy: profile.id,
    organizationId: profile.organizationId,
  });

  // task already completed
  if (checkLoyaltySubmission) return true;

  const verifyLoyalty = await checkLoyalty(profile, type);
  if (!verifyLoyalty) return false;

  const organization = await Organization.findById(profile.organizationId);
  if (!organization) throw new NotFoundError("organization not found");

  await LoyaltySubmission.create({
    profileId: profile.id,
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

  return true;
};

const calculateLoyaltyPoints = (loyalty: any) => {
  const discordPoints = loyalty.discordProfile ? 0.25 : 0;
  const twitterPoints = loyalty.twitterProfile ? 0.25 : 0;
  const gmPoints = loyalty.gm ? 0.25 : 0;
  const openseaPoints = loyalty.opensea ? 0.25 : 0;

  return openseaPoints + gmPoints + twitterPoints + discordPoints;
};
