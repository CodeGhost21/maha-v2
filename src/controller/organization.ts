import { Request, Response } from "express";
import { Organization } from "../database/models/organisation";

export const addOrganization = async (req: Request, res: Response) => {
  const checkOrganization = await Organization.findOne({
    $or: [{ name: req.body.orgName }, { guildId: req.body.guildId }],
  });
  if (!checkOrganization) {
    const newOrganization = new Organization({
      name: req.body.orgName,
      guildId: req.body.guildId,
      maxBoost: req.body.maxBoost,
    });
    await newOrganization.save();
    res.send(newOrganization);
  } else {
    res.send("already added");
  }
};
