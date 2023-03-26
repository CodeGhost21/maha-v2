import { Request, Response } from "express";
import { Organization } from "../../database/models/organization";
import NotFoundError from "../../errors/NotFoundError";
import { extractServerProfile } from "../../utils/jwt";

export const updateOrg = async (req: Request, res: Response) => {
  const serverProfile = await extractServerProfile(req);
  if (!serverProfile) throw new NotFoundError("serverProfile not found");

  const org = await Organization.findById(serverProfile.organizationId);
  if (!org) throw new NotFoundError("org not found");

  org.name = req.body.name || org.name;
  org.maxBoost = req.body.maxBoost || org.maxBoost;
  org.guildId = req.body.guildId || org.guildId;
  org.feedChannelId = req.body.feedChannelId || org.feedChannelId;
  org.msgChannelId = req.body.msgChannelId || org.msgChannelId;
  org.gmChannelId = req.body.gmChannelId || org.gmChannelId;

  await org.save();
  res.json({ success: true });
};

export const getOrg = async (req: Request, res: Response) => {
  const serverProfile = await extractServerProfile(req);
  if (!serverProfile) throw new NotFoundError("serverProfile not found");

  const org = await Organization.findById(serverProfile.organizationId);
  if (!org) throw new NotFoundError("org not found");
  res.json(org);
};
