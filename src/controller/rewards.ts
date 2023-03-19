import { BigNumber } from "bignumber.js";

import { IUserModel, User } from "../database/models/user";
import { PointTransaction } from "../database/models/pointTransaction";
import { saveFeed } from "../utils/saveFeed";
import * as web3 from "../utils/web3";

const e18 = new BigNumber(10).pow(18);

const calculateMAHAX = (nftData: {
  amount: number | string;
  end: number;
  start: number;
}) => {
  const maha = new BigNumber(nftData.amount);
  const duration = nftData.end - nftData.start;
  // years4 should be duration of maha locked
  const years4 = 86400 * 365 * 4;
  return maha.multipliedBy(duration).div(years4).div(e18).toNumber();
};

const getDailyTransactions = async (userId: string) => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  const dailyTransactions = await PointTransaction.find({
    userId: userId,
    createdAt: { $gt: start, $lt: end },
  }).select("addPoints subPoints userId");
  return dailyTransactions;
};

export const dailyMahaXRewards = async () => {
  const allUsers: IUserModel[] = await User.find({
    walletAddress: { $ne: "" },
  });

  allUsers.map(async (user) => {
    const noOfNFTs = await web3.balanceOf(user.walletAddress);

    if (noOfNFTs > 0) {
      let totalMahaX = 0;

      for (let i = 0; i < noOfNFTs; i++) {
        const nftId = await web3.tokenOfOwnerByIndex(user.walletAddress, i);
        const nftAmount = await web3.locked(nftId);
        const mahaX = await calculateMAHAX(nftAmount);
        totalMahaX += mahaX;
      }

      await PointTransaction.create({
        userId: user.id,
        type: "NFT Locked",
        totalPoints: user.totalPoints + Math.floor(totalMahaX),
        addPoints: Math.floor(totalMahaX),
      });
      user.totalPoints = user.totalPoints + Math.floor(totalMahaX);
      await user.save();

      await saveFeed(user, "normal", "mahaXLock", totalMahaX);
    }

    const dailyTransactions = await getDailyTransactions(user._id);
    if (dailyTransactions.length > 0) {
      const userLoyalty = await user.getLoyalty();

      let totalPoints = 0;
      dailyTransactions.map((item) => {
        if (item.addPoints > 0) totalPoints += item.addPoints;
      });
      const dailyLoyaltyPoints = totalPoints * userLoyalty.totalLoyalty;
      const newPointsTransaction = new PointTransaction({
        userId: user.id,
        type: "Loyalty",
        totalPoints: user.totalPoints + dailyLoyaltyPoints,
        addPoints: dailyLoyaltyPoints,
      });
      await newPointsTransaction.save();
      user["totalPoints"] = user.totalPoints + dailyLoyaltyPoints;
      await user.save();
      await saveFeed(user, "normal", "loyalty", dailyLoyaltyPoints);
      const loyalty = await user.getLoyalty();
      await loyalty.update({
        gm: false,
        twitterProfile: false,
        discordProfile: false,
        opensea: false,
      });
    }
  });
};
