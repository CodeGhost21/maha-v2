import { Request, Response } from "express";
import { User } from "../database/models/user";
import { userBonus } from "./zealyBot";
export const saveZelayUser = async (userId: string, userName: string) => {
  const findUser = await User.findOne({ zelayUserId: userId });
  if (!findUser) {
    await User.create({
      zelayUserId: userId,
      zelayUserName: userName,
    });
  } else {
    findUser.zelayUserId = userId;
    findUser.zelayUserName = userName;
    await findUser.save();
  }
};

export const giveXp = async (req: Request, response: Response) => {
  const findUser = await User.findOne({ zelayUserId: req.body.userId });
  if (findUser) {
    await userBonus(
      req.body.userId,
      req.body.xp,
      req.body.label,
      req.body.desc
    );
  }
};

export const fetchZelayUsers = async (req: any, res: any) => {
  const allUsers = await User.find({ zelayUserId: { $ne: "" } });
  res.send(allUsers);
};
