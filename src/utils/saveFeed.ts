import { Feed } from "../database/models/feed";
import { IUserModel } from "../database/models/user";

export const saveFeed = async (
  user: IUserModel,
  type: string,
  task: string,
  points: number
) => {
  await Feed.create({
    userId: user._id,
    type: type,
    task: task,
    points: points,
  });
};
