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
import NotFoundError from "../errors/NotFoundError";
import { UserPointTransactions } from "../database/models/userPointTransactions";
import { userLpData, supplyBorrowPointsGQL } from "./quests/onChainPoints";
import {
  apiBlast,
  apiEth,
  apiLinea,
  apiManta,
  apiXLayer,
  apiZKSync,
  whiteListTeam,
} from "./quests/constants";
import {
  blastProvider,
  ethLrtProvider,
  lineaProvider,
  mantaProvider,
  xLayerProvider,
  zksyncProvider,
} from "../utils/providers";

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
    const user = await WalletUserV2.findOne(
      {
        walletAddress: address,
      },
      { jwt: 1, role: 1 }
    );

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

export const fetchMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as IWalletUserModel;
  if (!user) return next(new NotFoundError());
  const totalSupplyPoints = 0;
  const totalBorrowPoints = 0;

  const userData = {
    ...user,
    totalSupplyPoints: totalSupplyPoints,
    totalBorrowPoints: totalBorrowPoints,
  };
  res.json({ success: true, userData });
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
    res.json({
      totalPoints: cachedTotalPoints || 0,
      totalUsers: cachedAllUSers || 0,
    });
  } catch (error) {
    console.error("Error occurred while retrieving total points:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserTotalPoints = async (req: Request, res: Response) => {
  const walletAddress: string = req.query.walletAddress as string;
  const user: any = await WalletUserV2.findOne({
    walletAddress: walletAddress.toLowerCase().trim(),
  }).select("totalPoints");
  if (!user) return res.json({ success: false, message: "no data found" });
  res.json({ success: true, totalPoints: user.totalPoints || 0 });
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
  })) as IWalletUserModel;
  if (walletUser) {
    const totalReferrals = await WalletUserV2.find({
      referredBy: walletUser.id,
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
      1
    );

    const zksyncData = await supplyBorrowPointsGQL(
      apiZKSync,
      [{ walletAddress } as IWalletUserModel],
      zksyncProvider,
      1
    );

    let mantaPoints = 0;
    let zksyncPoints = 0;

    const mantaSupply = mantaData.supply.get(walletAddress);
    const zksyncSupply = zksyncData.supply.get(walletAddress);

    for (const [_, value] of Object.entries(mantaSupply)) {
      mantaPoints += Number(value);
    }

    for (const [_, value] of Object.entries(zksyncSupply)) {
      zksyncPoints += Number(value);
    }

    if (mantaPoints > 100 || zksyncPoints > 100) {
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
      const mantaData = await supplyBorrowPointsGQL(
        apiManta,
        [{ walletAddress } as IWalletUserModel],
        mantaProvider,
        1
      );
      const zksyncData = await supplyBorrowPointsGQL(
        apiZKSync,
        [{ walletAddress } as IWalletUserModel],
        zksyncProvider,
        1
      );
      const blastData = await supplyBorrowPointsGQL(
        apiBlast,
        [{ walletAddress } as IWalletUserModel],
        blastProvider,
        1
      );
      const lineaData = await supplyBorrowPointsGQL(
        apiLinea,
        [{ walletAddress } as IWalletUserModel],
        lineaProvider,
        1
      );
      const ethereumLrt = await supplyBorrowPointsGQL(
        apiEth,
        [{ walletAddress } as IWalletUserModel],
        ethLrtProvider,
        1
      );
      const xlayerData = await supplyBorrowPointsGQL(
        apiXLayer,
        [{ walletAddress } as IWalletUserModel],
        xLayerProvider,
        2
      );
      res.json({
        success: true,
        mantaData: mantaData,
        zksyncData: zksyncData,
        blastData: blastData,
        lineaData: lineaData,
        ethereumLrt: ethereumLrt,
        xlayerData: xlayerData,
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
