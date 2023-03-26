import { Request, Response } from "express";
import { Organization } from "../../database/models/organization";
import { IServerProfileModel } from "../../database/models/serverProfile";
import NotFoundError from "../../errors/NotFoundError";

export const updateOrg = async (req: Request, res: Response) => {
  const serverProfile = req.user as IServerProfileModel;
  if (!serverProfile) throw new NotFoundError("serverProfile not found");

  const org = await Organization.findById(serverProfile.organizationId);
  if (!org) throw new NotFoundError("org not found");

  org.name = req.body.orgName || org.name;
  org.maxBoost = req.body.maxBoost || org.maxBoost;
  org.guildId = req.body.guildId || org.guildId;
  org.feedChannelId = req.body.feedChannelId || org.feedChannelId;
  org.msgChannelId = req.body.msgChannelId || org.msgChannelId;

  await org.save();
  res.json({ success: true });
};

export const getOrg = async (req: Request, res: Response) => {
  const serverProfile = req.user as IServerProfileModel;
  if (!serverProfile) throw new NotFoundError("serverProfile not found");

  const org = await Organization.findById(serverProfile.organizationId);
  if (!org) throw new NotFoundError("org not found");
  res.json(org);
};
