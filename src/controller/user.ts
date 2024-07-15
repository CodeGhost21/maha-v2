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
import { IAsset, IStakeAsset } from "src/database/interface/walletUser/assets";

const accessTokenSecret = nconf.get("JWT_SECRET");

export const getCurrentPoints = async (req: Request, res: Response) => {
  const walletAddress = req.query.address?.toString();

  try {
    const user = await _verifyAndGetUser(
      walletAddress,
      "points pointsPerSecond pointsPerSecondUpdateTimestamp referredBy"
    );

    const currentPoints = await _getCurrentPoints(user);

    res.status(200).json({ success: true, data: { ...currentPoints } });
  } catch (error: any) {
    try {
      const errorObj = JSON.parse(error.message);
      return res.status(errorObj.status).json(errorObj.obj);
    } catch (error) {
      console.log("oops!!", error);
    }
    res
      .status(500)
      .json({ success: false, data: { error: "Internal server error" } });
  }
};

export const getCurrentTotalPointsWithPPS = async (
  req: Request,
  res: Response
) => {
  const walletAddress = req.query.address?.toString();

  try {
    const user = await _verifyAndGetUser(
      walletAddress,
      "points pointsPerSecond pointsPerSecondUpdateTimestamp referredBy boostStake totalSupplyPoints totalBorrowPoints"
    );

    if (!user.pointsPerSecondUpdateTimestamp) {
      throw new Error("pointsPerSecondUpdateTimestamp not available");
    }

    const currentPoints = await _getCurrentPoints(user);
    const boost = user.boostStake ?? 1;

    const currentPointsProcessed = getTotalSupplyBorrowStakePoints({
      points: currentPoints,
    } as IWalletUserModel);

    const currentSupplyPoints =
      currentPointsProcessed.totalSupplyPoints <= 0
        ? user.totalSupplyPoints
        : currentPointsProcessed.totalSupplyPoints;
    const currentBorrowPoints =
      currentPointsProcessed.totalBorrowPoints <= 0
        ? user.totalBorrowPoints
        : currentPointsProcessed.totalBorrowPoints;

    const totalPoints = currentSupplyPoints + currentBorrowPoints; /*  +
      currentPointsProcessed.totalStakePoints */

    const { totalSum, supplySum, borrowSum /* , stakeSum */ } =
      _sumPointsPerSecond(user.pointsPerSecond);

    const returnData = {
      totalCurrentSupplyPointsPerSec: supplySum * boost,
      totalCurrentBorrowPointsPerSec: borrowSum * boost,
      totalCurrentStakingPointsPerSec: 0 /* stakeSum */,
      totalCurrentPointsPerSec: totalSum,
      totalCurrentSupplyPoints: currentSupplyPoints,
      totalCurrentBorrowPoints: currentBorrowPoints,
      totalCurrentStakingPoints: 0 /*  currentPointsProcessed.totalStakePoints */,
      totalCurrentPoints: totalPoints,
    };
    res.status(200).json({ success: true, data: { ...returnData } });
  } catch (error: any) {
    try {
      const errorObj = JSON.parse(error.message);
      return res.status(errorObj.status).json(errorObj.obj);
    } catch (_error: any) {
      console.log("oops!!", error);
    }
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

export const addCustomReferral = async (req: Request, res: Response) => {
  try {
    const { walletAddress, message, signHash, referralCode } = req.body;

    const _walletAddress = walletAddress.toLowerCase().trim();

    if (!walletAddress || !message || !signHash || !referralCode) {
      return res.status(400).json({
        success: false,
        data: { error: "bad request" },
      });
    }
    const user = await WalletUserV2.findOne({
      walletAddress: _walletAddress,
    }).select("referralCode");

    if (!user) {
      return res.status(404).json({
        success: false,
        data: { error: "user not found" },
      });
    }

    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature: signHash });

    const address = result.data.address.toLowerCase().trim();

    // todo: verify other data
    if (address !== _walletAddress) {
      return res.status(500).json({
        success: false,
        data: { error: "Signature verification failed. Invalid signature." },
      });
    }

    const referralCodes = user?.referralCode;

    if (referralCodes?.length === 2) {
      return res.status(406).json({
        success: false,
        data: { error: "failed to link referral code limit reached" },
      });
    }

    if (referralCodes[0] === referralCode) {
      return res.status(406).json({
        success: false,
        data: { error: "provided referral code already linked" },
      });
    }

    referralCodes?.push(referralCode);

    await WalletUserV2.updateOne(
      { walletAddress: _walletAddress },
      { $set: { referralCode: referralCodes } }
    );

    res.status(200).json({
      success: true,
      data: { message: "referral code linked successfully!" },
    });
  } catch (error) {
    console.error("Error occurred in linking custom referral:", error);
    res.status(500).json({
      success: false,
      data: { error: `Internal server error: ${error}` },
    });
  }
};

export const linkNewReferral = async (req: Request, res: Response) => {
  try {
    const { walletAddress, message, signHash, referralCode } = req.body;

    if (!walletAddress || !message || !signHash || !referralCode) {
      return res.status(400).json({
        success: false,
        data: { error: "bad request" },
      });
    }

    const _walletAddress = walletAddress.toLowerCase().trim();

    // find referrer
    const userReferrer = await WalletUserV2.findOne({
      referralCode: referralCode,
    }).select("walletAddress id referralCode");

    if (!userReferrer) {
      return res.status(404).json({
        success: false,
        data: {
          error: "invalid referral code",
        },
      });
    }

    // should not refer to self
    if (userReferrer.walletAddress === _walletAddress) {
      return res.status(404).json({
        success: false,
        data: {
          error: "cannot refer to self",
        },
      });
    }

    // find user
    let user = await WalletUserV2.findOne({
      walletAddress: _walletAddress,
    }).select("walletAddress id referredBy referralCode referrerCode");

    // if user is already referred by some other user, return
    if (user && user.referredBy) {
      return res.status(406).json({
        success: false,
        data: {
          error: "already linked to a referral code",
        },
      });
    }

    // verify signature
    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature: signHash });
    const address = result.data.address.toLowerCase().trim();

    if (
      address !== _walletAddress &&
      result.data.prepareMessage() === message
    ) {
      return res.status(500).json({
        success: false,
        data: { error: "Signature verification failed. Invalid signature." },
      });
    }

    let _message = "";
    if (!user) {
      console.log("Creating new user with wallet address", _walletAddress);
      user = await WalletUserV2.create({
        walletAddress: _walletAddress,
        referredBy: userReferrer.id,
        referrerCode: userReferrer.referralCode[0],
      });
      _message = "new user added and "
    }


    res.status(200).json({
      success: true,
      data: { message: _message + "referral code linked successfully!" },
    });
  } catch (error) {
    console.error("Error occurred in linking custom referral:", error);
    res.status(500).json({
      success: false,
      data: { error: `Internal server error: ${error}` },
    });
  }
};

export const userInfo = async (req: Request, res: Response) => {
  try {
    const walletAddress: string = req.query.address as string;

    const user = await _verifyAndGetUser(
      walletAddress,
      "rank points totalPoints referralCode referrerCode totalSupplyPoints totalBorrowPoints boostStake"
    );

    const userData = {
      rank: user.rank,
      referralPoints: user.points.referral ?? 0,
      referralCode: user.referralCode,
      referrerCode: user.referrerCode,
      totalPoints: user.totalPoints,
      stakeZeroPoints: /* user.points.stakeLinea?.zero ?? */ 0,
      totalStakePoints: /*  user.totalStakePoints */ 0,
      totalSupplyPoints: user.totalSupplyPoints,
      totalBorrowPoints: user.totalBorrowPoints,
      stakeBoost: user.boostStake ?? 1,
    };

    res.status(200).json({ success: true, data: { userData } });
  } catch (error: any) {
    try {
      const errorObj = JSON.parse(error.message);
      return res.status(errorObj.status).json(errorObj.obj);
    } catch (e) {
      console.log("oops!!", error);
    }
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

export const getLeaderBoardWithSortKeys = async (
  req: Request,
  res: Response
) => {
  try {
    const cachedData: string | undefined = cache.get(
      "lb:leaderBoardWithSortKeys"
    );
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
    const user = await _verifyAndGetUser(walletAddress, "totalPoints");

    res
      .status(200)
      .json({ success: true, data: { totalPoints: user.totalPoints || 0 } });
  } catch (error: any) {
    try {
      const errorObj = JSON.parse(error.message);
      return res.status(errorObj.status).json(errorObj.obj);
    } catch (error) {
      console.log("oops!!", error);
    }
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

export const getTotalSupplyBorrowStakePoints = (user: IWalletUserModel) => {
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

  let totalStakePoints = 0;
  if (user.points.stakeLinea) {
    totalStakePoints = 0;
  }

  return {
    totalSupplyPoints,
    totalBorrowPoints,
    totalStakePoints,
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

const _getCurrentPoints = async (user: IWalletUserModel) => {
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

  const previousPoints = user.points ?? {};
  const pointsPerSecond = user.pointsPerSecond;
  const pppUpdateTimestamp = user.pointsPerSecondUpdateTimestamp;
  const boost = user.boostStake ?? 1;

  const lpList = Object.keys(pointsPerSecond) as Array<keyof IWalletUserPoints>;
  let currentPoints = {} as IWalletUserPoints;

  lpList.forEach((lpTask) => {
    /* if (lpTask.startsWith("stake")) {
      const pppUpdateTimestampForTask = pppUpdateTimestamp[
        lpTask
      ] as IStakeAsset;
      const pps = pointsPerSecond[lpTask] as IStakeAsset;
      const oldPoints = previousPoints[lpTask] as IStakeAsset ?? {};

      const _points: Partial<IWalletUserPoints> = {
        [lpTask]: {} as IStakeAsset,
      };
      for (const [key, value] of Object.entries(pppUpdateTimestampForTask)) {
        const secondsElapsed = (Date.now() - Number(value)) / 1000;
        const newPoints =
          Number(pps[key as keyof IStakeAsset]) * secondsElapsed;

        let refPointForAsset = 0;
        if (referredByUser && Object.keys(referredByUser).length) {
          refPointForAsset = Number(newPoints * referralPercent);
        }
        const assetOldPoinst = oldPoints[key as keyof IStakeAsset] ?? 0;
        (_points[lpTask] as IStakeAsset)[key as keyof IStakeAsset] =
          newPoints + refPointForAsset + assetOldPoinst;
      }
      currentPoints = { ...currentPoints, ..._points };
    } */
    if (lpTask.startsWith("supply") || lpTask.startsWith("borrow")) {
      const pppUpdateTimestampForTask = pppUpdateTimestamp[lpTask] as IAsset;
      const pps = pointsPerSecond[lpTask] as IAsset;
      const oldPoints = (previousPoints[lpTask] as IAsset) ?? {};

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
          newPoints * boost + refPointForAsset + assetOldPoinst;
      }
      currentPoints = { ...currentPoints, ..._points };
    }
  });
  return currentPoints;
};

const _verifyAndGetUser = async (
  walletAddress: string | undefined,
  fields = "rank points totalPoints referralCode referredBy referrerCode"
) => {
  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    const errorObj = {
      status: 400,
      obj: { success: false, data: { error: "Address is required" } },
    };
    throw Error(JSON.stringify(errorObj));
  }

  const user = await WalletUserV2.findOne({
    walletAddress: walletAddress.toLowerCase().trim(),
  }).select(fields);

  if (!user) {
    const errorObj = {
      status: 400,
      obj: {
        success: false,
        data: { error: "user not found" },
      },
    };
    throw Error(JSON.stringify(errorObj));
  }

  return user;
};

function _sumPointsPerSecond(obj: any) {
  let totalSum = 0;
  let supplySum = 0;
  let borrowSum = 0;
  // let stakeSum = 0;

  function recurse(innerObj: any, parentKey: string) {
    for (const key in innerObj) {
      if (typeof innerObj[key] === "object" && innerObj[key] !== null) {
        recurse(innerObj[key], parentKey || key);
      } else if (typeof innerObj[key] === "number") {
        totalSum += innerObj[key];
        if (parentKey && parentKey.includes("supply")) {
          supplySum += innerObj[key];
        } else if (parentKey && parentKey.includes("borrow")) {
          borrowSum += innerObj[key];
        } /* else if (parentKey && parentKey.includes("stake")) {
          stakeSum += innerObj[key];
        } */
      }
    }
  }

  recurse(obj, "");

  return { totalSum, supplySum, borrowSum };
}

// const _getTotalStakePoints = (user: IWalletUserModel) => {
//   const points = user.points;
//   if (!user.points.stakeLinea) {
//     return 0;
//   }
//   const stakeLinea = points.stakeLinea;
//   const totalPoints = getTotalPoints(stakeLinea);
//   return totalPoints;
// };
