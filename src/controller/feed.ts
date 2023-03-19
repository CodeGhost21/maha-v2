import { IUserModel } from "../database/models/user";
import { Feed } from "../database/models/feed";
import { Request, Response } from "express";

export const allFeeds = async (_req: Request, res: Response) => {
  const feeds = await Feed.find()
    .sort({ createdAt: -1 })
    .populate("userId", "discordName discordAvatar totalPoints userID");
  res.json(feeds);
};

export const userFeeds = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;

  const feeds = await Feed.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .populate("userId", "discordName discordAvatar totalPoints userID");

  res.json(feeds);
};
