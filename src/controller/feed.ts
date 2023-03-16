import { User } from "../database/models/user";
import { Feed } from "../database/models/feed";

export const allFeeds = async (req: any, res: any) => {
  const feeds = await Feed.find()
    .sort({ createdAt: -1 })
    .populate("userId", "discordName discordAvatar totalPoints userID");
  res.send(feeds);
};

export const userFeeds = async (req: any, res: any) => {
  const user = await User.findOne({ _id: req.user.id });
  if (user) {
    const feeds = await Feed.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate("userId", "discordName discordAvatar totalPoints userID");
    res.send(feeds);
  }
};
