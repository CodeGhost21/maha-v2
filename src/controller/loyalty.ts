import { sendRequest } from "../library/sendRequest";
import { updateTwitterProfile } from "./user";
import { imageComparing } from "../library/imageComparer";
import { saveFeed } from "../utils/saveFeed";

import * as web3 from "../utils/web3";
import { Request, Response } from "express";
import { IUserModel } from "../database/models/user";

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

export const checkTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;

  const userLoyalty = await user.getLoyalty();

  if (req.body.task === "gm") {
    if (user.totalGMs > 0) {
      userLoyalty["gm"] = true;
      userLoyalty["totalLoyalty"] = userLoyalty.totalLoyalty + 0.25;
      await userLoyalty.save();
      await saveFeed(user, "loyalty", req.body.task, 0.25);
    }
  } else if (req.body.task === "twitterProfile") {
    //check for updated twitter profile
    const updatedUser = await updateTwitterProfile(user);
    const twitterResponse = await profileImageComparing(
      updatedUser.twitterProfileImg,
      48,
      updatedUser.walletAddress
    );

    if (twitterResponse) {
      userLoyalty["twitterProfile"] = true;
      userLoyalty["totalLoyalty"] = userLoyalty.totalLoyalty + 0.25;
      await userLoyalty.save();
      await saveFeed(user, "loyalty", req.body.task, 0.25);
    }
  } else if (req.body.task === "discordProfile") {
    const discordResponse = await profileImageComparing(
      `https://cdn.discordapp.com/avatars/${user.userID}/${user.discordAvatar}.jpg`,
      128,
      user.walletAddress
    );
    if (discordResponse) {
      userLoyalty["discordProfile"] = true;
      userLoyalty["totalLoyalty"] = userLoyalty.totalLoyalty + 0.25;
      await userLoyalty.save();
      await saveFeed(user, "loyalty", req.body.task, 0.25);
    }
  } else if (req.body.task === "intro") {
    // todo
  } else if (req.body.task === "opensea") {
    const response = await web3.isOpenseaApproved(user.walletAddress);
    if (!response) {
      userLoyalty["opensea"] = true;
      userLoyalty["totalLoyalty"] = userLoyalty.totalLoyalty + 0.25;
      await userLoyalty.save();
      await saveFeed(user, "loyalty", req.body.task, 0.25);
    }
  }

  res.json(userLoyalty);
};

export const getLoyalty = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  const userLoyalty = await user.getLoyalty();
  res.json(userLoyalty);
};
