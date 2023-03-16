import { Feed } from "../database/models/feed";

export const saveFeed = async (
  user: any,
  type: string,
  task: string,
  points: number
) => {
  const newFeed = new Feed({
    userId: user._id,
    type: type,
    task: task,
    points: points,
  });
  await newFeed.save();
};
