import { sendRequest } from "../library/sendRequest";
import { updateTwitterProfile } from "./user";
import { imageComparing } from "../library/imageComparer";
import { saveFeed } from "../utils/saveFeed";

import * as web3 from "../utils/web3";
import { Request, Response } from "express";
import { IUserModel } from "../database/models/user";
import { ILoyalty } from "../database/models/loyaty";

const profileImageComparing = async (
  profileImageUrl: string,
  size: number,
  walletAddress: string
) => {
  // resize image for image comparing
  const noOfNFTs = await web3.balanceOf(walletAddress);

  if (noOfNFTs == 0) return false;

  for (let i = 0; i < noOfNFTs; i++) {
    const nftId = await web3.tokenOfOwnerByIndex(walletAddress, i);
    const tokenUri = await web3.tokenURI(nftId);

    const data = await sendRequest<string>("get", tokenUri);
    const nftMetadata = JSON.parse(data);
    const response = await imageComparing(
      profileImageUrl,
      nftMetadata.image,
      size
    );

    if (response) return true;
  }

  return false;
};

const calculateLoyaltyPoints = (loyalty: ILoyalty) => {
  const discordPoints = loyalty.discordProfile ? 0.25 : 0;
  const twitterPoints = loyalty.twitterProfile ? 0.25 : 0;
  const gmPoints = loyalty.gm ? 0.25 : 0;
  const openseaPoints = loyalty.opensea ? 0.25 : 0;

  return openseaPoints + gmPoints + twitterPoints + discordPoints;
};

export const checkTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;

  const loyalty = await user.getLoyalty();
  const pointsBefore = calculateLoyaltyPoints(loyalty);

  if (req.body.task === "gm") loyalty.gm = user.totalGMs > 0;

  if (req.body.task === "twitterProfile") {
    // check for updated twitter profile
    const updatedUser = await updateTwitterProfile(user);
    const twitterCheck = await profileImageComparing(
      updatedUser.twitterProfileImg,
      48,
      updatedUser.walletAddress
    );

    loyalty.twitterProfile = twitterCheck;
  }

  if (req.body.task === "discordProfile") {
    const discordCheck = await profileImageComparing(
      `https://cdn.discordapp.com/avatars/${user.userID}/${user.discordAvatar}.jpg`,
      128,
      user.walletAddress
    );
    loyalty.discordProfile = discordCheck;
  }

  if (req.body.task === "intro") {
    // todo
  }

  if (req.body.task === "opensea") {
    const response = await web3.isOpenseaApproved(user.walletAddress);
    loyalty.opensea = !response;
  }

  const pointsAfter = calculateLoyaltyPoints(loyalty);
  loyalty.totalLoyalty = pointsAfter;
  await loyalty.save();

  if (pointsBefore != pointsAfter)
    await saveFeed(user, "loyalty", req.body.task, pointsAfter - pointsBefore);

  res.json({ pointsBefore, pointsAfter, loyalty });
};

export const getLoyalty = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userLoyalty = await user.getLoyalty();
  res.json(userLoyalty);
};
