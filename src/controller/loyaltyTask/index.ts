import { LoyaltySubmission } from "../../database/models/loyaltySubmission";
import {
  LoyaltyTask,
  LoyaltyTaskType,
} from "../../database/models/loyaltyTasks";
import { Organization } from "../../database/models/organization";
import { PointTransaction } from "../../database/models/pointTransaction";
import {
  IServerProfile,
  IServerProfileModel,
} from "../../database/models/serverProfile";
import NotFoundError from "../../errors/NotFoundError";

import { twitterProfileLoyalty } from "./twitterPFP";
import { discordProfileLoyalty } from "./discordPFP";
import { openseaLoyalty } from "./openseaRevoke";

const checkLoyalty = async (profile: IServerProfile, loyaltyType: string) => {
  if (loyaltyType === "twitter_profile") return twitterProfileLoyalty(profile);
  else if (loyaltyType === "discord_profile")
    return discordProfileLoyalty(profile);
  else if (loyaltyType === "revoke_opensea") return openseaLoyalty(profile);
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

  // todo: inform feed

  return true;
};

export const undoLoyaltyTask = async (
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

  // task was not complete; hence we skip
  if (!checkLoyaltySubmission) return false;

  // task was compelte before; so we recalculate loyalty
  checkLoyaltySubmission.delete();

  // recalculate profile loyalty weight
  const totalLoyaltyWeight = profile.loyaltyWeight - loyaltyTask.weight;
  profile.loyaltyWeight = totalLoyaltyWeight;
  await profile.save();

  // todo: inform feed

  return true;
};
