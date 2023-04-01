import { LoyaltySubmission } from "../../database/models/loyaltySubmission";
import {
  ILoyaltyTaskModel,
  LoyaltyTask,
  LoyaltyTaskType,
} from "../../database/models/loyaltyTasks";
import { Organization } from "../../database/models/organization";
import { IServerProfileModel } from "../../database/models/serverProfile";
import NotFoundError from "../../errors/NotFoundError";

import { twitterProfileLoyalty } from "./twitterPFP";
import { discordProfileLoyalty } from "./discordPFP";
import { openseaLoyalty } from "./openseaRevoke";
import { checkNftHoldTask } from "./nftHold";
import { sendFeedDiscord } from "../../utils/sendFeedDiscord";

const checkLoyalty = async (
  task: ILoyaltyTaskModel,
  profile: IServerProfileModel,
  loyaltyType: LoyaltyTaskType
) => {
  if (loyaltyType === "twitter_profile")
    return twitterProfileLoyalty(task, profile);
  else if (loyaltyType === "discord_profile")
    return discordProfileLoyalty(task, profile);
  else if (loyaltyType === "revoke_opensea") return openseaLoyalty(profile);
  else if (loyaltyType === "hold_nft") return checkNftHoldTask(profile);
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

  const verifyLoyalty = await checkLoyalty(loyaltyTask, profile, type);
  if (!verifyLoyalty) return false;

  const organization = await Organization.findById(profile.organizationId);
  if (!organization) throw new NotFoundError("organization not found");

  await LoyaltySubmission.create({
    profileId: profile.id,
    organizationId: organization.id,
    type: loyaltyTask.type,

    taskWeight: loyaltyTask.weight,
    oldProfileLoyalty: profile.loyaltyWeight,
    newProfileLoyalty: profile.loyaltyWeight + loyaltyTask.weight,
  });

  // recalculate profile loyalty weight
  const totalLoyaltyWeight = profile.loyaltyWeight + loyaltyTask.weight;
  profile.loyaltyWeight = totalLoyaltyWeight;
  await profile.save();

  // todo: inform feed
  let msg;
  if (type === "twitter_profile") msg = `updated their Twitter PFP 🐤`;
  else if (type === "hold_nft") msg = `is holding a NFT 💪`;
  else if (type === "discord_profile") msg = `updated their Discord PFP 🤖`;
  else if (type === "revoke_opensea")
    msg = `delisted their NFTs from Opensea ⛴`;

  if (msg) {
    const user = await profile.getUser();
    await sendFeedDiscord(
      organization.feedChannelId,
      `<@${user.discordId}> ${msg} and completed a loyalty task! `
    );
  }

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
