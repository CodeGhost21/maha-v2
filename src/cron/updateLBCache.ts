import { WalletUser } from "../database/models/walletUsers";
import cache from "../utils/cache";

export const updateLBCache = async () => {
  const allUsers = await WalletUser.find({ isDeleted: false })
    .sort({ rank: 1 })
    .select(
      "referralPoints totalPointsV2 totalPoints rank walletAddress points"
    )
    .limit(400);

  const data = JSON.stringify(allUsers);
  cache.set("lb:leaderBoard", data, 60 * 60);
};
