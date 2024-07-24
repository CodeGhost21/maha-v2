import { WalletUserV2 } from "../database/models/walletUsersV2";
import cache from "../utils/cache";

export const totalPoints = async () => {
  try {
    const totalPoints = await WalletUserV2.aggregate([
      {
        $group: {
          _id: null,
          totalPoints: { $sum: "$totalPoints" },
        },
      },
    ]);

    // Check if totalPoints is not empty before caching
    if (totalPoints.length > 0) {
      cache.set("tp:totalPoints", totalPoints[0].totalPoints, 60 * 60 * 1000); // Convert seconds to milliseconds
    }
    return totalPoints[0].totalPoints;
  } catch (error) {
    console.error("Error occurred while aggregating total points:", error);
  }
};
