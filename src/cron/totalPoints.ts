import { WalletUser } from "../database/models/walletUsers";
import cache from "../utils/cache";

export const totalPoints = async () => {
  const totalPoints = await WalletUser.aggregate([
    {
      $group: {
        _id: null,
        totalPoints: { $sum: "$totalPointsV2" },
      },
    },
  ]);
  cache.set("tp:totalPoints", totalPoints[0].totalPoints, 60 * 60);
};
