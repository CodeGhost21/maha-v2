import { WalletUserV2 } from "../database/models/walletUsersV2";
import cache from "../utils/cache";

export const updateLBCache = async () => {
  const allUsers = await WalletUserV2.find()
    .sort({ rank: 1 })
    .select(
      "referralPoints totalPointsV2 totalPoints rank walletAddress points"
    )
    .limit(400);

  const data = JSON.stringify(allUsers);
  cache.set("lb:leaderBoard", data, 60 * 60);
};
