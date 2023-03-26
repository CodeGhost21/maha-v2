import { ethers } from "ethers";
import { Request, Response } from "express";
import { sendRequest } from "../library/sendRequest";
import { IUserModel } from "../database/models/user";
import { PointTransaction } from "../database/models/pointTransaction";
import NotFoundError from "../errors/NotFoundError";
import { sendFeedDiscord } from "../utils/sendFeedDiscord";
import { fetchDiscordAvatar } from "../utils/discord";

export const fetchMe = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  if (user) return res.json(user);
  throw new NotFoundError();
};

// get latest rewards of a user
export const getRecentRewards = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;

  const recentRewards = await PointTransaction.find({
    userId: user.id,
    addPoints: { $gt: 0 },
  }).select("type createdAt addPoints");
  res.json(recentRewards);
};

// user points
export const getUsersDailyPoints = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;

  const dailyPoints = await PointTransaction.find({
    userId: user.id,
  }).select("totalPoints createdAt");

  const usersDailyPoints = dailyPoints.map((i) => [
    new Date(i.createdAt).getTime(),
    i.totalPoints,
  ]);

  res.json(usersDailyPoints);
};

// connect wallet verify
export const walletVerify = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;

  const message = `Login into Gifts of Eden: ${user.id}`;
  const result = ethers.utils.verifyMessage(message, req.body.hash);

  if (result === req.body.address) {
    user.walletAddress = req.body.address;
    await user.save();
    sendFeedDiscord(`@${user.discordName} has verified their wallet address`);
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
};

export const fetchTwitterProfile = async (user: IUserModel) => {
  const response = await sendRequest<string>(
    "get",
    `https://api.twitter.com/1.1/users/show.json?screen_name=${user.twitterScreenName}`
  );
  const parseResponse = JSON.parse(response);
  return parseResponse.profile_image_url_https;
};

export const fetchDiscordProfile = async (user: IUserModel) => {
  const avatar = await fetchDiscordAvatar(user);
  if (avatar) {
    user.discordAvatar = avatar;
    user.save();
  }

  return avatar;
};
