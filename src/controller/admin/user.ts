import { Request, Response } from "express";
import { ServerProfile } from "../../database/models/serverProfile";
import NotFoundError from "../../errors/NotFoundError";
import { extractServerProfile } from "../../utils/jwt";

export const fetchMe = async (req: Request, res: Response) => {
  const user = await extractServerProfile(req);
  if (user) return res.json(user);
  throw new NotFoundError();
};

export const allUsers = async (req: Request, res: Response) => {
  const user = await extractServerProfile(req);

  const users = await ServerProfile.find({
    organizationId: user.organizationId,
  })
    .limit(100)
    .populate("userId");

  res.json(users);
};
