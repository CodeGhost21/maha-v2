import { IWalletUserModel, WalletUser } from "../database/models/walletUsers";
import { NextFunction, Request, Response } from "express";
import { SiweMessage } from "../siwe/lib/client";
import * as jwt from "jsonwebtoken";
import BadRequestError from "../errors/BadRequestError";
import cache from "../utils/cache";
import nconf from "nconf";
import NotFoundError from "../errors/NotFoundError";

const accessTokenSecret = nconf.get("JWT_SECRET");

const _generateReferralCode = () => {
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

    console.log(result, req.body);

    // todo: verify other data
    if (result.data.address !== req.body.message.address) {
      throw new BadRequestError(
        "Signature verification failed. Invalid signature."
      );
    }

    const user = await WalletUser.findOne({
      walletAddress: result.data.address,
    });

    if (user) {
      user.jwt = await jwt.sign({ id: String(user.id) }, accessTokenSecret);
      await user.save();
      return res.json({ success: true, user });
    }

    const usersCount = await WalletUser.count();
    const referralCode = _generateReferralCode();

    const newUser = await WalletUser.create({
      walletAddress: req.body.message.address,
      rank: usersCount + 1,
      referralCode: referralCode ? referralCode : null,
    });

    // referred by user added to user model
    if (req.body.referredByCode !== "") {
      const referrer = await WalletUser.findOne({
        referralCode: req.body.referredByCode,
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

export const getLeaderBoard = async (req: any, res: any) => {
  const cachedData: string | undefined = cache.get("lb:leaderBoard");
  if (cachedData) return res.json(JSON.parse(cachedData || ""));
  res.json([]);
};

export const getTotalUsers = async (req: any, res: any) => {
  res.json({ totalUsers: (await WalletUser.count()) || [] });
};

export const getTotalReferralOfUsers = async (req: any, res: any) => {
  const user = req.user as IWalletUserModel;
  const totalReferrals = await WalletUser.find({ referredBy: user.id });

  res.json({ totalReferrals: totalReferrals.length });
};
