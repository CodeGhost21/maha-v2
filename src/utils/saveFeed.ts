import nconf from 'nconf';
// import { Feed } from "../database/models/feed";
// import { IUserModel } from "../database/models/user";
import { sendMessage } from "./discord";

export const saveFeed = async (
  // user: IUserModel,
  // type: string,
  // task: string,
  // points: number,
  msg: string
) => {
  // await Feed.create({
  //   userId: user._id,
  //   type: type,
  //   task: task,
  //   points: points,
  // });

  sendMessage(nconf.get("CHANNEL_FEED"), msg);
};
