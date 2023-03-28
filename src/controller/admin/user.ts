import { Request, Response } from "express";
import { ServerProfile } from "../../database/models/serverProfile";
import NotFoundError from "../../errors/NotFoundError";
import { extractServerProfile } from "../../utils/jwt";

export const fetchMe = async (req: Request, res: Response) => {
  const user = await extractServerProfile(req);
  if (user) {
    const serverProfile = await ServerProfile.findOne({
      _id: user.id,
    }).populate("userId");
    return res.json(serverProfile);
  }
  throw new NotFoundError();
};

export const allUsers = async (req: Request, res: Response) => {
  const user = await extractServerProfile(req);

  const users = await ServerProfile.find({
    organizationId: user.organizationId,
  })
    .populate("userId")
    .limit(100);

  res.json(users);
};
