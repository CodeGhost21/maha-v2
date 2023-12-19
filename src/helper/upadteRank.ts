import { User } from "../database/models/user";

export const assignRank = async (discordId: string) => {
  const users = await User.find().sort({ streak: -1, lastGM: 1 });
  let rank = 0;
  await users.map(async (user) => {
    rank = rank + 1;
    user["gmRank"] = rank;
    await user.save();
  });
  const userRank = await User.findOne({ discordId: discordId });
  return {
    rank: userRank?.gmRank,
    totalUsers: users.length,
  };
};
