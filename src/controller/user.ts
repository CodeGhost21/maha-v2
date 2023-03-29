import { ethers } from "ethers";
import { Request, Response } from "express";
import { sendRequest } from "../library/sendRequest";
import { IUserModel } from "../database/models/user";
import NotFoundError from "../errors/NotFoundError";
import { sendFeedDiscord } from "../utils/sendFeedDiscord";
import { fetchDiscordAvatar } from "../utils/discord";
import { extractServerProfile } from "../utils/jwt";
import { ServerProfile } from "../database/models/serverProfile";
import { Organization } from "../database/models/organization";

export const fetchMe = async (req: Request, res: Response) => {
  const profile = await extractServerProfile(req);
  if (profile) return res.json(profile);
  throw new NotFoundError();
};

// connect wallet verify
export const walletVerify = async (req: Request, res: Response) => {
  const profile = await extractServerProfile(req);
  const user = await profile.getUser();

  const message = `Login into Gifts of Eden: ${profile.userId}`;
  const result = ethers.utils.verifyMessage(message, req.body.hash);

  if (result === req.body.address) {
    user.walletAddress = req.body.address;
    await user.save();
    const userProfile: any = await ServerProfile.findOne({ userId: user.id });
    const org: any = await Organization.findOne({
      _id: userProfile.organizationId,
    });
    sendFeedDiscord(
      org.feedChannelId,
      `@${user.discordId} has verified their wallet address`
    );
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
