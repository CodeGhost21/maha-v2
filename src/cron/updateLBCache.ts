import { getTotalSupplyBorrowPoints } from "../controller/user";
import { WalletUserV2 } from "../database/models/walletUsersV2";
import cache from "../utils/cache";

export const updateLBCache = async () => {
  const allUsersData = await WalletUserV2.find()
    .sort({ rank: 1 })
    .select("totalPoints rank walletAddress points")
    .limit(400);

  interface lbUserData {
    address: string;
    totalSupplyPoints: number;
    totalBorrowPoints: number;
    totalPoints: number;
  }
  const lbData: lbUserData[] = [];
  allUsersData.map((user) => {
    const pointsTotal = getTotalSupplyBorrowPoints(user);
    lbData.push({
      address: user.walletAddress,
      totalSupplyPoints: pointsTotal.totalSupplyPoints,
      totalBorrowPoints: pointsTotal.totalBorrowPoints,
      totalPoints: user.totalPoints,
    });
  });

  const data = JSON.stringify(lbData);
  cache.set("lb:leaderBoard", data, 60 * 60);
};
