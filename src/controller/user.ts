import _ from "underscore";
import { getEpoch } from "../utils/epoch";
import { NextFunction, Request, Response } from "express";
import nconf from "nconf";
import { ethers } from "ethers";

import * as jwt from "jsonwebtoken";

import { IWalletUserModel, WalletUser } from "../database/models/walletUsers";
import { SiweMessage } from "../siwe/lib/client";
import {
  userLpData,
  supplyBorrowPointsMantaMulticall,
  supplyBorrowPointsZksyncMulticall,
  supplyBorrowPointsBlastMulticall,
  supplyBorrowPointsLineaMulticall,
  supplyBorrowPointsEthereumLrtMulticall,
} from "./quests/onChainPoints";
import BadRequestError from "../errors/BadRequestError";
import cache from "../utils/cache";

import NotFoundError from "../errors/NotFoundError";
import pythAddresses from "../addresses/pyth.json";
import { IPythStaker } from "./interface/IPythStaker";
import {
  getMantaStakedData,
  getMantaStakedDataAccumulate,
  getMantaStakedDataBifrost,
} from "./quests/stakeManta";
import { UserPointTransactions } from "../database/models/userPointTransactions";
import { whiteListTeam } from "./quests/constants";

const accessTokenSecret = nconf.get("JWT_SECRET");

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
    const user = await WalletUser.findOne({
      walletAddress: address,
      isDeleted: false,
    });

    if (user) {
      user.jwt = await jwt.sign({ id: String(user.id) }, accessTokenSecret);
      user.role = role;
      await user.save();
      return res.json({ success: true, user });
    }

    const usersCount = await WalletUser.count();
    const referralCode = _generateReferralCode();

    const newUser = await WalletUser.create({
      walletAddress: address,
      rank: usersCount + 1,
      epoch: getEpoch(),
      referralCode: referralCode ? referralCode : null,
      role: role,
    });

    // referred by user added to user model
    if (req.body.referredByCode !== "") {
      const referrer = await WalletUser.findOne({
        referralCode: req.body.referredByCode,
        isDeleted: false,
      });
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

export const fetchMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as IWalletUserModel;
  if (!user) return next(new NotFoundError());
  res.json({ success: true, user });
};

export const getLeaderBoard = async (req: Request, res: Response) => {
  const cachedData: string | undefined = cache.get("lb:leaderBoard");
  if (cachedData) return res.json(JSON.parse(cachedData || ""));
  res.json([]);
};

export const getTotalUsers = async (req: Request, res: Response) => {
  const cachedData: string | undefined = cache.get("tu:allUsers");
  res.json({ totalUsers: cachedData });
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

export const getPythData = async (req: Request, res: Response) => {
  const walletAddress: string = req.query.walletAddress as string;
  if (walletAddress && ethers.isAddress(walletAddress)) {
    const typedAddresses: IPythStaker[] = pythAddresses as IPythStaker[];
    const pythData = typedAddresses.find(
      (item) =>
        item.evm.toLowerCase().trim() === walletAddress.toLowerCase().trim()
    );

    if (pythData) {
      res.json({
        success: true,
        pythData: {
          ...pythData,
          stakedAmount: pythData.stakedAmount / 1e6,
        },
      });
    } else {
      res.json({ success: false, message: "no data found" });
    }
  } else {
    res.json({
      success: false,
      message: "Wallet address not provided or is incorrect",
    });
  }
};

export const getMantaData = async (req: Request, res: Response) => {
  const walletAddress: string = req.query.walletAddress as string;
  if (walletAddress && ethers.isAddress(walletAddress)) {
    const mantaData: any = await getMantaStakedData(walletAddress);
    const mantaBifrost = await getMantaStakedDataBifrost(walletAddress);
    const mantaAccumulate = await getMantaStakedDataAccumulate(walletAddress);
    console.log(mantaData, mantaBifrost, mantaAccumulate);

    const totalStaked = mantaData.success
      ? mantaData.data.totalStakingAmount
      : 0;
    +mantaBifrost + mantaAccumulate;
    // if (mantaData.success) {
    res.json({
      mantaData: mantaData.success ? mantaData.data.totalStakingAmount : 0,
      mantaBifrost: mantaBifrost,
      mantaAccumulate: mantaAccumulate,
      totalStaked: totalStaked,
    });
    // } else {
    //   res.json({ success: mantaData.success, message: mantaData.message });
    // }
  } else {
    res.json({
      success: false,
      message: "Wallet address not provided or is incorrect",
    });
  }
};

export const getTotalPoints = async (req: Request, res: Response) => {
  try {
    const cachedData: number | undefined = cache.get("tp:totalPoints");
    res.json({ totalPoints: cachedData || 0 });
  } catch (error) {
    console.error("Error occurred while retrieving total points:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserTotalPoints = async (req: Request, res: Response) => {
  const walletAddress: string = req.query.walletAddress as string;
  const user: any = await WalletUser.findOne({
    walletAddress: walletAddress.toLowerCase().trim(),
    isDeleted: false, //{ $regex: new RegExp("^" + walletAddress + "$", "i") },
  });
  if (!user) return res.json({ success: false, message: "no data found" });
  res.json({ success: true, totalPoints: user.totalPointsV2 || 0 });
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

export const galxeLPCheck = async (req: Request, res: Response) => {
  const walletAddress: string = req.query.address as string;
  let success = false;

  try {
    const mantaData = await supplyBorrowPointsMantaMulticall([walletAddress]);
    const zksyncData = await supplyBorrowPointsZksyncMulticall([walletAddress]);
    if (mantaData[0].supply.points > 100 || zksyncData[0].supply.points > 100) {
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
      const mantaData = await supplyBorrowPointsMantaMulticall([walletAddress]);
      const zksyncData = await supplyBorrowPointsZksyncMulticall([
        walletAddress,
      ]);
      const blastData = await supplyBorrowPointsBlastMulticall([walletAddress]);
      const lineaData = await supplyBorrowPointsLineaMulticall([walletAddress]);
      const ethereumLrt = await supplyBorrowPointsEthereumLrtMulticall([
        walletAddress,
      ]);
      res.json({
        success: true,
        mantaData: mantaData[0],
        zksyncData: zksyncData[0],
        blastData: blastData[0],
        lineaData: lineaData[0],
        ethereumLrt: ethereumLrt[0],
      });
    } else {
      res.json({ success: false, message: "please provide wallet address" });
    }
  } catch (e) {
    console.log(e);
  }
};
