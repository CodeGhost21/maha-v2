import { WalletUser } from "../database/models/walletUsers";
import cache from "../controller/cache";

export const updateLBCache = async () => {
  const allUsers = await WalletUser.find({})
    .sort({ rank: 1 })
    .select("referralPoints totalPoints rank walletAddress")
    .limit(100);

  const data = JSON.stringify(allUsers);
  cache.set("lb:leaderBoard", data, 60 * 60);
};
