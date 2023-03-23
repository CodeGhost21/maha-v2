import { sendRequest } from "../library/sendRequest";
import { fetchTwitterProfile } from "./user";
import { imageComparing } from "../library/imageComparer";
// import { saveFeed } from "../utils/saveFeed";
import { fetchDiscordProfile } from "./user";
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

const calculateLoyaltyPoints = (loyalty: any) => {
  const discordPoints = loyalty.discordProfile ? 0.25 : 0;
  const twitterPoints = loyalty.twitterProfile ? 0.25 : 0;
  const gmPoints = loyalty.gm ? 0.25 : 0;
  const openseaPoints = loyalty.opensea ? 0.25 : 0;

  return openseaPoints + gmPoints + twitterPoints + discordPoints;
};

export const checkLoyaltyTask = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;

  // const loyalty = await user.getLoyalty();
  // const pointsBefore = calculateLoyaltyPoints(loyalty);

  // elvin's bot -> data (submission) + loyaltyTaskId

  // -> validate based on the loyalty

  // if (req.body.task === "gm") loyalty.gm = user.totalGMs > 0;

  // // check for updated twitter profile
  // if (req.body.task === "twitterProfile") {
  //   // todo; refresh the user's twitter profile by fetching the latest profile
  //   const twitterProfile = await fetchTwitterProfile(user);
  //   const twitterCheck = await profileImageComparing(
  //     twitterProfile,
  //     48,
  //     user.walletAddress
  //   );
  //   loyalty.twitterProfile = twitterCheck;
  // }

  // // check for updated discord profile
  // if (req.body.task === "discordProfile") {
  //   // todo refresh the discord profile by fetching the latest one using
  //   // the user's access token
  //   const discordProfile = await fetchDiscordProfile(user);
  //   const discordCheck = await profileImageComparing(
  //     `https://cdn.discordapp.com/avatars/${user.userID}/${discordProfile}.jpg`,
  //     128,
  //     user.walletAddress
  //   );
  //   loyalty.discordProfile = discordCheck;
  // }

  // if (req.body.task === "intro") {
  //   // todo
  // }

  // if (req.body.task === "opensea") {
  //   const response = await web3.isOpenseaApproved(user.walletAddress);
  //   loyalty.opensea = !response;
  // }

  // const pointsAfter = calculateLoyaltyPoints(loyalty);
  // loyalty.totalLoyalty = pointsAfter;
  // await loyalty.save();

  // if (pointsBefore != pointsAfter)
  //   await saveFeed(user, "loyalty", req.body.task, pointsAfter - pointsBefore);

  // res.json({ pointsBefore, pointsAfter, loyalty });
};

export const getLoyalty = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  // const userLoyalty = await user.getLoyalty();
  // res.json(userLoyalty);
  res.send({});
};
