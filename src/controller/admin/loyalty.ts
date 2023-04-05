import { Request, Response } from "express";

import { LoyaltyTask } from "../../database/models/loyaltyTasks";
import BadRequestError from "../../errors/BadRequestError";
import { extractServerProfile } from "../../utils/jwt";

const loyaltyTypes = [
  "twitter_follow",
  "twitter_pfp",
  "hold_nft",
  "discord_pfp",
  "revoke_opensea",
];

export const allLoyaltyTask = async (req: Request, res: Response) => {
  // const organizationId = req.params.orgId;
  const user = await extractServerProfile(req);
  const loyaltyTasks = await LoyaltyTask.find({
    organizationId: user.organizationId,
  });
  res.json(loyaltyTasks);
};

export const addLoyaltyTask = async (req: Request, res: Response) => {
  const profile = await extractServerProfile(req);

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
    createdBy: profile.id,
    twitterScreenName: req.body?.screenName,
    contractAddress: req.body?.contractAddress,
  });

  res.json(newLoyaltyTask);
};

export const deleteLoyaltyTask = async (req: Request, res: Response) => {
  const profile = await extractServerProfile(req);
  await LoyaltyTask.deleteOne({
    _id: req.params.id,
    organizationId: profile.organizationId,
  });
  res.json({ success: true });
};

export const updateLoyalty = async (req: Request, res: Response) => {
  const profile = await extractServerProfile(req);

  const loyalty = await LoyaltyTask.findOne({
    _id: req.params.id,
    organizationId: profile.organizationId,
  });
  if (loyalty) {
    loyalty.name = req.body.name || loyalty.name;
    loyalty.type = req.body.type || loyalty.type;
    loyalty.weight = req.body.weight || loyalty.weight;
    loyalty.instruction = req.body.instruction || loyalty.instruction;
    loyalty.twitterScreenName =
      req.body.screenName || loyalty.twitterScreenName;
    await loyalty.save();
    res.json({ success: true });
  } else res.json({ success: false, message: "loyalty not found" });
};

export const types = async (req: Request, res: Response) => {
  res.json(loyaltyTypes);
};
