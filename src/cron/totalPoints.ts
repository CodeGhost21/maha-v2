import { WalletUser } from "../database/models/walletUsers";
import cache from "../utils/cache";

export const totalPoints = async () => {
  try {
    const totalPoints = await WalletUser.aggregate([
      {
        $group: {
          _id: null,
          totalPoints: { $sum: "$totalPointsV2" },
        },
      },
    ]);

    // Check if totalPoints is not empty before caching
    if (totalPoints.length > 0) {
      cache.set("tp:totalPoints", totalPoints[0].totalPoints, 60 * 60 * 1000); // Convert seconds to milliseconds
    }
  } catch (error) {
    console.error("Error occurred while aggregating total points:", error);
  }
};
