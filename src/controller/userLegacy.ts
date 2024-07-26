import _ from "underscore";
import { Request, Response } from "express";
import { IWalletUserModel, WalletUser } from "../database/models/walletUsers";
import cache from "../utils/cache";
import { UserPointTransactions } from "../database/models/userPointTransactions";

export const _generateReferralCode = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let referralCode = "";
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters.charAt(randomIndex);
  }
  return referralCode;
};

export const getLeaderBoard = async (req: Request, res: Response) => {
  const cachedData: string | undefined = cache.get("lb:leaderBoardLegacy");
  if (cachedData) return res.json(JSON.parse(cachedData || ""));

  const allUsers = await WalletUser.find({ isDeleted: false })
    .sort({ rank: 1 })
    .select(
      "referralPoints totalPointsV2 totalPoints rank walletAddress points"
    )
    .limit(400);

  const data = JSON.stringify(allUsers);
  cache.set("lb:leaderBoardLegacy", data, 60 * 60);
  res.json(data);
};

export const getTotalUsers = async (req: Request, res: Response) => {
  const cachedData: number = cache.get("tu:allUsersLegacy") as number;
  if (cachedData) return res.status(200).json(cachedData);
  const allUsers = await WalletUser.count();
  cache.set("tu:allUsersLegacy", { totalUsers: allUsers }, 60 * 60);
  res.status(200).json({ totalUsers: allUsers });
};

export const getTotalReferralOfUsers = async (req: Request, res: Response) => {
  const user = req.user as IWalletUserModel;
  const totalReferrals = await WalletUser.find({
    referredBy: user.id,
    isDeleted: false,
  }).select("totalPointsV2 walletAddress ");

  res.json({
    totalReferrals: totalReferrals.length,
    referralUsers: totalReferrals,
  });
};

export const getTotalPoints = async (req: Request, res: Response) => {
  try {
    const cachedData: number = cache.get("tp:totalPointsLegacy") as number;
    if (cachedData >= 0) {
      return res.status(200).json({ totalPoints: cachedData });
    }
    const totalPoints = await WalletUser.aggregate([
      {
        $group: {
          _id: null,
          totalPoints: { $sum: "$totalPoints" },
        },
      },
    ]);

    if (totalPoints.length > 0) {
      cache.set(
        "tp:totalPointsLegacy",
        totalPoints[0].totalPoints,
        60 * 60 * 1000
      );
    }
    res.status(200).json({ totalPoints: totalPoints[0].totalPoints || 0 });
  } catch (error) {
    console.error("Error occurred while retrieving total points:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserTotalPoints = async (req: Request, res: Response) => {
  try {
    const walletAddress: string = req.query.walletAddress as string;
    if (!walletAddress) {
      return res
        .status(400)
        .json({ success: false, data: { error: "Address is required" } });
    }

    const user: any = await WalletUser.findOne({
      walletAddress: walletAddress.toLowerCase().trim(),
      isDeleted: false, //{ $regex: new RegExp("^" + walletAddress + "$", "i") },
    }).select("totalPoints totalPointsV2 points");

    if (!user)
      return res
        .status(404)
        .json({ success: false, data: { error: "no data found" } });
    // console.log(user, user.totalPointsV2);
    res.status(200).json({
      success: true,
      data: { totalPoints: user.totalPointsV2 || 0, points: user.points },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, data: { error: "Internal server error" } });
  }
};

export const getUserReferralData = async (req: Request, res: Response) => {
  const referralCode: string = req.query.referralCode as string;
  if (!referralCode)
    return res.json({
      success: false,
      message: "please provide referral code",
    });
  const walletUser: IWalletUserModel = (await WalletUser.findOne({
    referralCode: referralCode,
    isDeleted: false,
  })) as IWalletUserModel;
  if (walletUser) {
    const totalReferrals = await WalletUser.find({
      referredBy: walletUser.id,
      isDeleted: false,
    });

    res.json({
      success: true,
      totalReferrals: totalReferrals.length || 0,
      referralPoints: walletUser.points.referral || 0,
    });
  } else {
    res.json({ success: false, message: "no data found" });
  }
};

export const getReferralUsers = async (req: Request, res: Response) => {
  try {
    const user = req.user as IWalletUserModel;
    const referralUsers = await WalletUser.find({
      referredBy: user.id,
      isDeleted: false,
    })
      // .sort({
      //   createdAt: -1,
      // })
      .select("referralCode totalPointsV2 walletAddress rank");

    console.log("referralUsers", referralUsers);

    res.json({ success: true, referralUsers });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserTransactions = async (req: Request, res: Response) => {
  const user = req.user as IWalletUserModel;
  // const checkAdmin = whiteListTeam.includes(
  //   user.walletAddress.toLowerCase().trim()
  // );
  // if (!checkAdmin) {
  //   return res.json({ success: false, message: "Unauthorized" });
  // }
  const transactions = await UserPointTransactions.find({
    userId: user.id,
  }).sort({
    createdAt: -1,
  });
  res.json({ success: true, transactions });
};
