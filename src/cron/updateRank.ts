import Bluebird from "bluebird";
import { WalletUser } from "../database/models/walletUsers";

export const updateRank = async () => {
  const users = await WalletUser.find({})
    .sort({ totalPoints: -1 })
    .select("_id");

  console.log(`updating rank of over ${users.length} users`);

  await Bluebird.mapSeries(users, async (user, index) => {
    user.rank = index + 1;
    await user.save();
  });

  console.log("done updating ranks");
};
