import Bluebird from "bluebird";

import { Organization } from "../../database/models/organization";
import {
  IServerProfileModel,
  ServerProfile,
} from "../../database/models/serverProfile";
import { ITaskModel, Task } from "../../database/models/tasks";
import { sendRequest } from "../../library/sendRequest";
import { completeTask } from ".";

export const twitterFollowTask = async () => {
  const orgTwitterFollowTask = await Task.find({ type: "twitter_follow" });

  Bluebird.mapSeries(orgTwitterFollowTask, async (singleTask: ITaskModel) => {
    const organization: any = await Organization.findOne({
      _id: singleTask.organizationId,
    });
    const allUsers: any = await ServerProfile.find({
      organizationId: organization.id,
    }).populate("userId");

    Bluebird.mapSeries(allUsers, async (user: IServerProfileModel) => {
      //check for twitter follow
      const response = await sendRequest<string>(
        "get",
        `https://api.twitter.com/1.1/followers/ids.json?screen_name=MahaDAO`
      );
      const parseResponse = JSON.parse(response);
      if (response) {
        if (parseResponse.ids.includes(user.userId.twitterID)) {
          await completeTask(user, "twitter_follow");
        }
      }
    });
  });
};

export const test = async () => {
  const response = await sendRequest<string>(
    "get",
    `https://api.twitter.com/1.1/followers/ids.json?screen_name=MahaDAO`
  );
  const parseResponse = JSON.parse(response);
};
