import { User } from "../database/models/user";
import { Feed } from "../database/models/feed";
import { PassportRequest } from "../interface";
import { Response } from "express";

export const allFeeds = async (req: PassportRequest, res: Response) => {
  const feeds = await Feed.find()
    .sort({ createdAt: -1 })
    .populate("userId", "discordName discordAvatar totalPoints userID");
  res.json(feeds);
};

export const userFeeds = async (req: PassportRequest, res: Response) => {
  const user = await User.findOne({ _id: req.user.id });
  if (user) {
    const feeds = await Feed.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate("userId", "discordName discordAvatar totalPoints userID");
    res.json(feeds);
  }
};
