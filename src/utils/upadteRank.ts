import Bluebird from "bluebird";
import { ServerProfile } from "../database/models/serverProfile";
import { User } from "../database/models/user";

export const assignRank = async (profile: IServerProfileModel) => {
  const users = await ServerProfile.find().sort({ streak: -1, lastGM: 1 });
  let rank = 0;

  await Bluebird.mapSeries(users, async (user) => {
    rank = rank + 1;
    user.gmRank = rank;
    return user.save();
  });

  const userRank = await ServerProfile.findById(profile.id);
  return {
    rank: userRank?.gmRank,
    totalUsers: users.length,
  };
};
