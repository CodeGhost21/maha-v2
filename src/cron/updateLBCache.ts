import { getTotalSupplyBorrowStakePoints } from "../controller/user";
import { WalletUserV2 } from "../database/models/walletUsersV2";
import cache from "../utils/cache";

// interface LBData {
//   byTotalPoints: lbUserData[];
//   byReferralPoints: lbUserData[];
//   byStakePoints: lbUserData[];
//   bySupplyPoints: lbUserData[];
//   byBorrowPoints: lbUserData[];
// }
// interface lbUserData {
//   address: string;
//   referralPoints: number;
//   totalStakePoints: number;
//   totalSupplyPoints: number;
//   totalBorrowPoints: number;
//   totalPoints: number;
// }

// export const updateLBCache = async () => {


  
  // const lbData: LBData = {
  //   byTotalPoints: [],
  //   byReferralPoints: [],
  //   byStakePoints: [],
  //   bySupplyPoints: [],
  //   byBorrowPoints: [],
  // };
  
  // const sortKeyTotalPoints = await WalletUserV2.find()
  //   .sort({ rank: 1 })
  //   .select(
  //     "totalPoints walletAddress points totalStakePoints totalSupplyPoints totalBorrowPoints"
  //   )
  //   .limit(100);


  // sortKeyTotalPoints.map((user) => {
  //   lbData.byTotalPoints.push({
  //     address: user.walletAddress,
  //     referralPoints: user.points.referral ?? 0,
  //     totalStakePoints: user.totalStakePoints,
  //     totalSupplyPoints: user.totalSupplyPoints,
  //     totalBorrowPoints: user.totalBorrowPoints,
  //     totalPoints: user.totalPoints,
  //   });
  // });

  // const sortKeyReferralPoints = await WalletUserV2.find()
  //   .sort({ "points.referral": -1 })
  //   .select(
  //     "totalPoints rank walletAddress points totalStakePoints totalSupplyPoints totalBorrowPoints"
  //   )
  //   .limit(100);

  // sortKeyReferralPoints.map((user) => {
  //   lbData.byReferralPoints.push({
  //     address: user.walletAddress,
  //     referralPoints: user.points.referral ?? 0,
  //     totalStakePoints: user.totalStakePoints,
  //     totalSupplyPoints: user.totalSupplyPoints,
  //     totalBorrowPoints: user.totalBorrowPoints,
  //     totalPoints: user.totalPoints,
  //   });
  // });

  // const sortTotalStakePoints = await WalletUserV2.find()
  //   .sort({ totalStakePoints: -1 })
  //   .select(
  //     "totalPoints walletAddress points totalStakePoints totalSupplyPoints totalBorrowPoints"
  //   )
  //   .limit(100);

  // sortTotalStakePoints.map((user) => {
  //   lbData.byStakePoints.push({
  //     address: user.walletAddress,
  //     referralPoints: user.points.referral ?? 0,
  //     totalStakePoints: user.totalStakePoints,
  //     totalSupplyPoints: user.totalSupplyPoints,
  //     totalBorrowPoints: user.totalBorrowPoints,
  //     totalPoints: user.totalPoints,
  //   });
  // });

  // const sortTotalSupplyPoints = await WalletUserV2.find()
  //   .sort({ totalSupplyPoints: -1 })
  //   .select(
  //     "totalPoints walletAddress points totalStakePoints totalSupplyPoints totalBorrowPoints"
  //   )
  //   .limit(100);

  // sortTotalSupplyPoints.map((user) => {
  //   lbData.bySupplyPoints.push({
  //     address: user.walletAddress,
  //     referralPoints: user.points.referral ?? 0,
  //     totalStakePoints: user.totalStakePoints,
  //     totalSupplyPoints: user.totalSupplyPoints,
  //     totalBorrowPoints: user.totalBorrowPoints,
  //     totalPoints: user.totalPoints,
  //   });
  // });

  // const totalBorrowPoints = await WalletUserV2.find()
  //   .sort({ totalBorrowPoints: -1 })
  //   .select(
  //     "totalPoints walletAddress points totalStakePoints totalSupplyPoints totalBorrowPoints"
  //   )
  //   .limit(100);

  // totalBorrowPoints.map((user) => {
  //   lbData.byBorrowPoints.push({
  //     address: user.walletAddress,
  //     referralPoints: user.points.referral ?? 0,
  //     totalStakePoints: user.totalStakePoints,
  //     totalSupplyPoints: user.totalSupplyPoints,
  //     totalBorrowPoints: user.totalBorrowPoints,
  //     totalPoints: user.totalPoints,
  //   });
  // });

//   const data = JSON.stringify(lbData);
//   cache.set("lb:leaderBoard", data, 60 * 60);
// };
export const updateLBCache = async () => {
  const allUsersData = await WalletUserV2.find({rank:{$exists:true}})
    .sort({ rank: 1 })
    .select("totalPoints totalSupplyPoints totalBorrowPoints totalStakePoints rank walletAddress points")
    .limit(100);

  interface lbUserData {
    address: string;
    referralPoints: number;
    totalStakePoints: number;
    totalSupplyPoints: number;
    totalBorrowPoints: number;
    totalPoints: number;
  }
  const lbData: lbUserData[] = [];
  allUsersData.map((user) => {
    const pointsTotal = getTotalSupplyBorrowStakePoints(user);
    lbData.push({
      address: user.walletAddress,
      referralPoints: user.points.referral ?? 0,
      totalStakePoints: pointsTotal.totalStakePoints,
      totalSupplyPoints: pointsTotal.totalSupplyPoints,
      totalBorrowPoints: pointsTotal.totalBorrowPoints,
      totalPoints: user.totalPoints,
    });
  });

  const data = JSON.stringify(lbData);
  cache.set("lb:leaderBoard", data, 60 * 60);
};