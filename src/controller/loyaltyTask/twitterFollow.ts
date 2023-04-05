import Bluebird from "bluebird";
import {
  ILoyaltyTaskModel,
  LoyaltyTask,
} from "../../database/models/loyaltyTasks";

import {
  IServerProfileModel,
  ServerProfile,
} from "../../database/models/serverProfile";
import { sendRequest } from "../../library/sendRequest";
import { completeLoyaltyTask, undoLoyaltyTask } from "./index";

/**
 * This is a one-time task that checks if the user holds a nft of a given type
 * and gives points.
 */
export const checkTwitterFollowTaskForEveryone = async () => {
  const tasks = await LoyaltyTask.find({
    type: "twitter_follow",
  });

  return Bluebird.mapSeries(tasks, async (task) => {
    const profiles = await ServerProfile.find({
      organizationId: task.organizationId,
    }).populate("userId.twitterScreenName");

    return Bluebird.mapSeries(profiles, (p) =>
      checkTwitterFollowLoyaltyTask(task, p)
    );
  });
};

export const checkTwitterFollowLoyaltyTask = async (
  task: ILoyaltyTaskModel,
  profile: IServerProfileModel,
) => {
  // check for twitter follow
  if (!profile.userId.twitterScreenName) return false;
  console.log(
    `https://api.twitter.com/1.1/friendships/show.json?source_screen_name=${task.twitterScreenName}&target_screen_name=${profile.userId.twitterScreenName}`
  );

  const response = await sendRequest<string>(
    "get",
    `https://api.twitter.com/1.1/friendships/show.json?source_screen_name=${task.twitterScreenName}&target_screen_name=${profile.userId.twitterScreenName}`
  );
  const parseResponse = JSON.parse(response);
  console.log(parseResponse);

  if (parseResponse.relationship.source.followed_by)
    return completeLoyaltyTask(profile, "twitter_follow");
  return undoLoyaltyTask(profile, "twitter_follow");
};
