import _ from "underscore";
import { getEpoch } from "../utils/epoch";
import { NextFunction, Request, Response } from "express";
import nconf from "nconf";
import { ethers } from "ethers";
import * as jwt from "jsonwebtoken";
import {
  IWalletUserModel,
  WalletUserV2,
} from "../database/models/walletUsersV2";
import { SiweMessage } from "../siwe/lib/client";
import BadRequestError from "../errors/BadRequestError";
import cache from "../utils/cache";
import { UserPointTransactions } from "../database/models/userPointTransactions";
import { userLpData, supplyBorrowPointsGQL } from "./quests/onChainPoints";
import {
  apiBlast,
  apiEth,
  apiLinea,
  apiManta,
  apiXLayer,
  apiZKSync,
  blastMultiplier,
  ethLrtMultiplier,
  lineaMultiplier,
  mantaMultiplier,
  minSupplyAmount,
  referralPercent,
  xlayerMultiplier,
  zksyncMultiplier,
} from "./quests/constants";
import {
  blastProvider,
  ethLrtProvider,
  lineaProvider,
  mantaProvider,
  xLayerProvider,
  zksyncProvider,
} from "../utils/providers";
import axios from "axios";
import { IWalletUserPoints } from "src/database/interface/walletUser/walletUserPoints";
import { IAsset } from "src/database/interface/walletUser/assets";

const accessTokenSecret = nconf.get("JWT_SECRET");

export const getCurrentPoints = async (req: Request, res: Response) => {
  const walletAddress = req.query.address;
  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    return res
      .status(400)
      .json({ success: false, data: { error: "Address is required" } });
  }

  const user = await WalletUserV2.findOne({
    walletAddress: walletAddress.toLowerCase().trim(),
  }).select("points pointsPerSecond pointsPerSecondUpdateTimestamp referredBy");

  if (!user) {
    return res.status(404).json({
      success: false,
      data: { error: "user not found" },
    });
  }

  let referredByUser = {} as IWalletUserModel;
  if (user.referredBy) {
    try {
      referredByUser = await WalletUserV2.findOne({
        _id: user.referredBy,
      }).select("id");
    } catch (error) {
      throw new Error(`error while fetching referred by users, ${error}`);
    }
  }

  // current points will be calculated based on stored pps and ppsUpdateTimestamp
  try {
    const previousPoints = user.points;
    const pointsPerSecond = user.pointsPerSecond;
    const pppUpdateTimestamp = user.pointsPerSecondUpdateTimestamp;

    const lpList = Object.keys(pointsPerSecond) as Array<
      keyof IWalletUserPoints
    >;

    let currentPoints = {} as IWalletUserPoints;

    lpList.forEach((lpTask) => {
      if (lpTask.startsWith("stake")) {
        if (user.pointsPerSecond.stakeZero) {
          const stakingTimeElapsed = user.pointsPerSecondUpdateTimestamp
            .stakeZero
            ? (Date.now() -
                Number(user.pointsPerSecondUpdateTimestamp.stakeZero)) /
              1000
            : 0;
          currentPoints.stakeZero =
            stakingTimeElapsed * user.pointsPerSecond.stakeZero;
        }
      } else {
        const pppUpdateTimestampForTask = pppUpdateTimestamp[lpTask] as IAsset;
        const pps = pointsPerSecond[lpTask] as IAsset;
        const oldPoints = previousPoints[lpTask] as IAsset;

        const _points: Partial<IWalletUserPoints> = {
          [lpTask]: {} as IAsset,
        };
        for (const [key, value] of Object.entries(pppUpdateTimestampForTask)) {
          const secondsElapsed = (Date.now() - Number(value)) / 1000;
          const newPoints = Number(pps[key as keyof IAsset]) * secondsElapsed;

          let refPointForAsset = 0;
          if (referredByUser && Object.keys(referredByUser).length) {
            refPointForAsset = Number(newPoints * referralPercent);
          }
          const assetOldPoinst = oldPoints[key as keyof IAsset] ?? 0;
          (_points[lpTask] as IAsset)[key as keyof IAsset] =
            newPoints + refPointForAsset + assetOldPoinst;
        }
        currentPoints = { ...currentPoints, ..._points };
      }
    });

    res.status(200).json({ success: true, data: { ...currentPoints } });
  } catch (error) {
    console.log("error in calculating current points:", error);
    res
      .status(500)
      .json({ success: false, data: { error: "Internal server error" } });
  }
};
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

export const walletVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature });

    const address = result.data.address.toLowerCase().trim();

    // todo: verify other data
    if (address !== req.body.message.address.toLowerCase()) {
      throw new BadRequestError(
        "Signature verification failed. Invalid signature."
      );
    }

    //assign role
    const role = await userLpData(address);
    const user = await WalletUserV2.findOne({
      walletAddress: address,
    }).select("id");

    if (user) {
      user.jwt = await jwt.sign({ id: String(user.id) }, accessTokenSecret);
      user.role = role;
      await user.save();
      return res.json({ success: true, user });
    }

    const usersCount = await WalletUserV2.count();
    const referralCode = _generateReferralCode();

    const newUser = await WalletUserV2.create({
      walletAddress: address,
      rank: usersCount + 1,
      epoch: getEpoch(),
      referralCode: referralCode ? [referralCode] : [],
      role: role,
    });

    // referred by user added to user model
    if (req.body.referredByCode !== "") {
      const referrer = await WalletUserV2.findOne(
        {
          referralCode: req.body.referredByCode,
        },
        { walletAddress: 1 }
      );
      if (referrer) newUser.referredBy = referrer.id;
    }

    // add jwt token
    newUser.jwt = await jwt.sign({ id: String(newUser.id) }, accessTokenSecret);
    await newUser.save();
    return res.json({ success: true, user: newUser });
  } catch (error) {
    next(error);
  }
};

export const userInfo = async (req: Request, res: Response) => {
  try {
    const walletAddress: string = req.query.address as string;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res
        .status(400)
        .json({ success: false, data: { error: "Address is required" } });
    }

    const user = await WalletUserV2.findOne({
      walletAddress: walletAddress.toLowerCase().trim(),
    }).select("rank points totalPoints");

    if (!user)
      return res.status(404).json({
        success: false,
        data: { error: "user not found" },
      });

    const pointsTotal = getTotalSupplyBorrowPoints(user);
    const userData = {
      rank: user.rank,
      referralPoints: user.points.referral || 0,
      totalPoints: user.totalPoints,
      totalSupplyPoints: pointsTotal.totalSupplyPoints,
      totalBorrowPoints: pointsTotal.totalBorrowPoints,
    };
    res.status(200).json({ success: true, data: { userData } });
  } catch (error) {
    console.error("Error occurred while data:", error);
    res
      .status(500)
      .json({ success: false, data: { error: "Internal server error" } });
  }
};

export const getLeaderBoard = async (req: Request, res: Response) => {
  try {
    const cachedData: string | undefined = cache.get("lb:leaderBoard");
    if (cachedData)
      return res
        .status(200)
        .json({ success: true, data: JSON.parse(cachedData) });
    res.status(200).json({
      success: false,
      data: { error: "data is being updated, please try after some time." },
    });
  } catch (error) {
    console.error("Error occurred while retrieving data:", error);
    res
      .status(500)
      .json({ success: false, data: { error: "Internal server error" } });
  }
};

export const getTotalUsers = async (req: Request, res: Response) => {
  try {
    const cachedData: string | undefined = cache.get("tu:allUsers");
    if (cachedData) {
      return res
        .status(200)
        .json({ success: true, data: { totalUsers: cachedData } });
    } else {
      res.status(200).json({
        success: false,
        data: { error: "data is being updated, please try after some time." },
      });
    }
  } catch (error) {
    console.error("Error occurred while data:", error);
    res
      .status(500)
      .json({ success: false, data: { error: "Internal server error" } });
  }
};

export const getTotalReferralOfUsers = async (req: Request, res: Response) => {
  const user = req.user as IWalletUserModel;
  const totalReferrals = await WalletUserV2.find({
    referredBy: user.id,
  }).select("totalPointsV2 walletAddress ");

  res.json({
    totalReferrals: totalReferrals.length,
    referralUsers: totalReferrals,
  });
};

export const getUsersData = async (req: Request, res: Response) => {
  try {
    const cachedAllUSers: string | undefined = cache.get("tu:allUsers");
    const cachedTotalPoints: number | undefined = cache.get("tp:totalPoints");

    if (cachedAllUSers && cachedTotalPoints) {
      res.status(200).json({
        success: true,
        data: {
          totalPoints: cachedTotalPoints || 0,
          totalUsers: cachedAllUSers || 0,
        },
      });
    } else {
      res.status(200).json({
        success: false,
        data: { error: "data is being updated, please try after some time." },
      });
    }
  } catch (error) {
    console.error("Error occurred while retrieving data:", error);
    res
      .status(500)
      .json({ success: false, data: { error: "Internal server error" } });
  }
};

export const getUserTotalPoints = async (req: Request, res: Response) => {
  try {
    const walletAddress: string = req.query.walletAddress as string;
    const user: IWalletUserModel = await WalletUserV2.findOne({
      walletAddress: walletAddress.toLowerCase().trim(),
    }).select("totalPoints points");
    if (!user)
      return res
        .status(404)
        .json({ success: false, data: { error: "user not found" } });
    res
      .status(200)
      .json({ success: true, data: { totalPoints: user.totalPoints || 0 } });
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
  const walletUser: IWalletUserModel = (await WalletUserV2.findOne({
    referralCode: referralCode,
    isDeleted: false,
  })) as IWalletUserModel;
  if (walletUser) {
    const totalReferrals = await WalletUserV2.find({
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
    const referralUsers = await WalletUserV2.find({
      referredBy: user.id,
    })
      // .sort({
      //   createdAt: -1,
      // })
      .select("referralCode totalPoints walletAddress rank");

    console.log("referralUsers", referralUsers);

    res.json({ success: true, referralUsers });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const galxeLPCheck = async (req: Request, res: Response) => {
  const walletAddress: string = req.query.address as string;
  let success = false;

  try {
    const mantaData = await supplyBorrowPointsGQL(
      apiManta,
      [{ walletAddress } as IWalletUserModel],
      mantaProvider,
      mantaMultiplier
    );

    const zksyncData = await supplyBorrowPointsGQL(
      apiZKSync,
      [{ walletAddress } as IWalletUserModel],
      zksyncProvider,
      zksyncMultiplier
    );

    const mantaSupply = mantaData.supply.get(walletAddress);
    const zksyncSupply = zksyncData.supply.get(walletAddress);

    const mantaPoints = getTotalPoints(mantaSupply);
    const zksyncPoints = getTotalPoints(zksyncSupply);

    if (mantaPoints > minSupplyAmount || zksyncPoints > minSupplyAmount) {
      success = true;
    }
    res.json({
      is_ok: success,
    });
  } catch (error) {
    res.json({
      is_ok: success,
    });
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

export const getLPData = async (req: Request, res: Response) => {
  try {
    const walletAddress: string = req.query.walletAddress as string;
    console.log(walletAddress);

    if (walletAddress && ethers.isAddress(walletAddress)) {
      const lpData = await getLpDataForAddress(walletAddress);
      res.json({
        success: true,
        ...lpData,
      });
    } else {
      res.json({
        success: false,
        message: "Wallet address not provided or is incorrect",
      });
    }
  } catch (e) {
    console.log(e);
  }
};

const getLpDataForAddress = async (walletAddress: string) => {
  const mantaData = await supplyBorrowPointsGQL(
    apiManta,
    [{ walletAddress } as IWalletUserModel],
    mantaProvider,
    mantaMultiplier
  );
  const zksyncData = await supplyBorrowPointsGQL(
    apiZKSync,
    [{ walletAddress } as IWalletUserModel],
    zksyncProvider,
    zksyncMultiplier
  );
  const blastData = await supplyBorrowPointsGQL(
    apiBlast,
    [{ walletAddress } as IWalletUserModel],
    blastProvider,
    blastMultiplier
  );
  const lineaData = await supplyBorrowPointsGQL(
    apiLinea,
    [{ walletAddress } as IWalletUserModel],
    lineaProvider,
    lineaMultiplier
  );
  const ethereumLrtData = await supplyBorrowPointsGQL(
    apiEth,
    [{ walletAddress } as IWalletUserModel],
    ethLrtProvider,
    ethLrtMultiplier
  );
  const xlayerData = await supplyBorrowPointsGQL(
    apiXLayer,
    [{ walletAddress } as IWalletUserModel],
    xLayerProvider,
    xlayerMultiplier
  );

  return {
    zksyncData,
    mantaData,
    xlayerData,
    ethereumLrtData,
    blastData,
    lineaData,
  };
};

export const getTotalPoints = (supplyOrBorrowObject: any) => {
  let totalPoints = 0;
  for (const [_, value] of Object.entries(supplyOrBorrowObject)) {
    totalPoints += Number(value);
  }
  return totalPoints;
};

export const getTotalSupplyBorrowPoints = (user: IWalletUserModel) => {
  // get supply points for all chains and their assets
  const points = user.points;
  const mantaSupply = points.supplyManta || {};
  const zksyncSupply = points.supplyZkSync || {};
  const xlayerSupply = points.supplyXLayer || {};
  const ethereumLrtSupply = points.supplyEthereumLrt || {};
  const blastSupply = points.supplyBlast || {};
  const lineaSupply = points.supplyLinea || {};

  // get borrow points for all chains and their assets
  const mantaBorrow = points.borrowManta || {};
  const zksyncBorrow = points.borrowZkSync || {};
  const xlayerBorrow = points.borrowXLayer || {};
  const ethereumLrtBorrow = points.borrowEthereumLrt || {};
  const blastBorrow = points.borrowBlast || {};
  const lineaBorrow = points.borrowLinea || {};

  const totalSupplyPoints =
    getTotalPoints(mantaSupply) +
    getTotalPoints(zksyncSupply) +
    getTotalPoints(xlayerSupply) +
    getTotalPoints(ethereumLrtSupply) +
    getTotalPoints(blastSupply) +
    getTotalPoints(lineaSupply);
  const totalBorrowPoints =
    getTotalPoints(mantaBorrow) +
    getTotalPoints(zksyncBorrow) +
    getTotalPoints(xlayerBorrow) +
    getTotalPoints(ethereumLrtBorrow) +
    getTotalPoints(blastBorrow) +
    getTotalPoints(lineaBorrow);

  return {
    totalSupplyPoints,
    totalBorrowPoints,
  };
};

export const getOpensBlockData = async (req: Request, res: Response) => {
  const cachedData = cache.get(`xp:openApi`);
  console.log("459", cachedData);

  if (cachedData)
    return res.status(200).json({
      success: true,
      xp: cachedData,
    });
  const url = `https://kx58j6x5me.execute-api.us-east-1.amazonaws.com/linea/getUserPointsSearch?user=0x0f6e98a756a40dd050dc78959f45559f98d3289d`;
  const response = await axios.get(url);
  const xp = response.data.length > 0 ? response.data[0].xp : 0;

  cache.set("xp:openApi", xp, 60 * 60);
  res.status(200).json({
    success: true,
    xp: xp,
  });
};

export const getGlobalTotalPoints = async (req: Request, res: Response) => {
  try {
    const cachedData: number = cache.get("tp:totalPoints") as number;
    if (cachedData >= 0) {
      return res.status(200).json({ totalPoints: cachedData });
    }
    res.status(200).json({
      success: false,
      data: { error: "data is being updated, please try after some time." },
    });
  } catch (error) {
    console.error("Error occurred while retrieving total points:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
