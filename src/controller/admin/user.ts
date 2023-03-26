import { Request, Response } from "express";
import { IServerProfile } from "../../database/models/serverProfile";
import { IUserModel, User } from "../../database/models/user";
import NotFoundError from "../../errors/NotFoundError";

export const fetchMe = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  if (user) return res.json(user);
  throw new NotFoundError();
};

export const allUsers = async (req: Request, res: Response) => {
  const user = req.user as IServerProfile;

  const users = await User.find({
    organizationId: user.organizationId,
  }).limit(100);

  res.json(users);
};
