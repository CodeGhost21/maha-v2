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
  console.log("twitterFollowTask");

  const orgTwitterFollowTask = await Task.find({ type: "twitter_follow" });
  console.log(16, orgTwitterFollowTask);

  if (orgTwitterFollowTask.length > 0) {
    Bluebird.mapSeries(orgTwitterFollowTask, async (singleTask: ITaskModel) => {
      const organization: any = await Organization.findOne({
        _id: singleTask.organizationId,
      });
      const allUsers: any = await ServerProfile.find({
        organizationId: organization.id,
      }).populate("userId");

      Bluebird.mapSeries(allUsers, async (user: IServerProfileModel) => {
        //check for twitter follow
        if (user.userId.twitterScreenName !== undefined) {
          const response = await sendRequest<string>(
            "get",
            `https://api.twitter.com/1.1/friendships/show.json?source_screen_name=${singleTask.twitterScreenName}&target_screen_name=${user.userId.twitterScreenName}`
          );
          const parseResponse = JSON.parse(response);
          if (parseResponse.relationship.source.followed_by) {
            completeTask(user, "twitter_follow");
          }
        }
      });
    });
  }
};

// export const test = async () => {
//   let count = 0;
//   let response = await sendRequest<string>(
//     "get",
//     // `https://api.twitter.com/1.1/followers/list.json?screen_name=mahadao&count=200`
//     // `https://api.twitter.com/1.1/followers/ids.json?screen_name=themahadao`
//     // `https://api.twitter.com/1.1/friendships/show.json?source_screen_name=mahadao&target_screen_name=Mia77006907`
//     `https://api.twitter.com/1.1/friendships/show.json?source_screen_name=themahadao&target_screen_name=anikethpanchidi`
//     // `https://api.twitter.com/1.1/users/lookup.json?user_id=54374012`,
//     // `https://api.twitter.com/2/users/1329145622507696000`
//   );
//   const parseResponse = JSON.parse(response);
//   console.log(parseResponse);
//   // count += parseResponse.users.length;
//   // let nextCursor = parseResponse.next_cursor_str;
//   // while (nextCursor !== "0") {
//   //   console.log(nextCursor);

//   //   response = await sendRequest<string>(
//   //     "get",
//   //     `https://api.twitter.com/1.1/followers/list.json?screen_name=mahadao&count=200&cursor=${nextCursor}`
//   //   );
//   //   const parseing = JSON.parse(response);
//   //   count += parseing.users.length;
//   //   nextCursor = parseing.next_cursor_str;
//   // }
//   // console.log(count);
// };
