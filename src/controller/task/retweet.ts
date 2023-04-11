import Bluebird from "bluebird";
import { completeTask } from ".";
import {
  IServerProfileModel,
  ServerProfile,
} from "../../database/models/serverProfile";
import { Task, TaskTypes, ITaskModel } from "../../database/models/tasks";
import { TaskSubmission } from "../../database/models/taskSubmission";
import { User } from "../../database/models/user";
import { sendRequest } from "../../library/sendRequest";

type TwitterResponse = {
  user: { id_str: string };
};

export const executeRetweetTask = async () => {
  const retweetTasks = await Task.find({
    type: "retweet",
    createdAt: { $gt: new Date(Date.now() - 86400000 * 5) },
  }).populate("organizationId._id");

  console.log(retweetTasks);

  await Bluebird.mapSeries(retweetTasks, async (task: ITaskModel) => {
    const tweetId: string | undefined = fetchTweetId(task.link);
    if (tweetId !== undefined) {
      const profiles = await fetchProfilesThatRetweeted(
        tweetId,
        task.organizationId.id
      );
      await Bluebird.mapSeries(
        profiles,
        async (singleProfile: IServerProfileModel) => {
          await completeTask(singleProfile, "retweet");
        }
      );
    }
  });
};

export const fetchProfilesThatRetweeted = async (
  tweetId: string,
  orgId: string
) => {
  const response = await sendRequest<string>(
    "get",
    `https://api.twitter.com/1.1/statuses/retweets/${tweetId}.json`
  );
  const parseResponse: TwitterResponse[] = JSON.parse(response);

  const twitterIds: string[] = parseResponse.map((t) => t.user.id_str);

  const users = await User.find({
    twitterID: { $in: twitterIds },
  }).select("_id");

  const userIds = users.map((u) => u._id);

  const profiles = await ServerProfile.find({
    organizationId: orgId,
    userId: { $in: userIds },
  });
  console.log(profiles);

  return profiles;

  // for these users mark the task as done
};

export const fetchTweetId = (uri: string) => {
  //   const uri =
  //     "https://twitter.com/TheMahaDAO/status/1644741561643593732?cxt=HHwWiMCzkY7vpdMtAAAA";

  const match = uri.match("status\\/(\\d+)/?");
  return match && match.length > 0 ? match[1] : undefined;
};
