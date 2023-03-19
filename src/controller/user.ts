import Bluebird from "bluebird";
import { ethers } from "ethers";
import { Request, Response } from "express";

import { IUserModel, User } from "../database/models/user";
import { Loyalty } from "../database/models/loyaty";
import { PointTransaction } from "../database/models/pointTransaction";
import twiiterOauth from "../library/twitter-oauth";
import NotFoundError from "../errors/NotFoundError";

export const fetchMe = async (req: Request, res: Response) => {
  const user = req.user as IUserModel;
  if (user) return res.json(user);
  throw new NotFoundError();
};

//users leaderboard
export const getLeaderboard = async (req: Request, res: Response) => {
  const users = await User.find()
    .select("discordName totalPoints discordAvatar userID")
    .sort({ totalPoints: -1 })
    .limit(100);

  const allUsers = await Bluebird.mapSeries(users, async (user) => {
    const userLoyalty = await Loyalty.findOne({ userId: user._id });
    return {
      discordName: user.discordName,
      totalPoints: user.totalPoints,
      imageUrl: `https://cdn.discordapp.com/avatars/${user.userID}/${user.discordAvatar}`,
      loyaltyPoints: userLoyalty != null ? userLoyalty.totalLoyalty : 0,
    };
  });

  res.json(allUsers);
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
    user.discordVerify = true;
    user.signDiscord = true;
    await user.save();
    // const discordMsgEmbed = new MessageEmbed()
    //   .setColor("#F07D55")
    //   .setDescription("Congratulation your wallet has been connected");
    // const payload = {
    //   embeds: [discordMsgEmbed],
    // };
    // sendMessage(nconf.get("CHANNEL_WALLET_CONNECT"), payload);
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
};

//fetch nft of all users peroidically
export const fetchNFT = async () => {
  const allUsers = await User.find();
  if (allUsers.length > 0) {
    await allUsers.map(async (user) => {
      // if (user.walletAddress !== "") {
      //   const noOfNFTs = await mahaXContract.methods
      //     .balanceOf(user.walletAddress)
      //     .call();
      //   if (noOfNFTs > 0) {
      //     // let totalMahaStaked = 0;
      //     // for (let i = 0; i < noOfNFTs; i++) {
      //     //   const nftId = await mahaXContract.methods
      //     //     .tokenOfOwnerByIndex(user.walletAddress, i)
      //     //     .call();
      //     //   const nftAmount = await mahaXContract.methods.locked(nftId).call();
      //     //   if (nftAmount.amount / 1e18 >= 100) {
      //     //     totalMahaStaked += nftAmount.amount / 1e18;
      //     //   }
      //     // }
      //     // console.log("totalMahaStaked", totalMahaStaked);
      //     // if (totalMahaStaked > 300) {
      //     await User.updateOne(
      //       { walletAddress: user.walletAddress },
      //       { stakedMaha: true }
      //     );
      //     //       }
      //   }
      // }
    });
  }
};

// fetchNFT()

export const updateTwitterProfile = async (user: IUserModel) => {
  const response = await twiiterOauth.getProtectedResource(
    "https://api.twitter.com/1.1/account/verify_credentials.json",
    "GET",
    user.twitterOauthAccessToken,
    user.twitterOauthAccessTokenSecret
  );

  const parseData = JSON.parse(response.data);
  user.twitterProfileImg = parseData.profile_image_url_https;
  await user.save();
  return user;
};

export const updateDiscordProfile = async () => {
  // nothing
};
