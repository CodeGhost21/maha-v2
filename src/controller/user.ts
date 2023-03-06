import nconf from "nconf";
import * as ethers from "ethers";
const Bluebird = require("bluebird");
// import * as jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { MessageEmbed } from "discord.js";

import { sendMessage } from "../output/discord";
import { User } from "../database/models/user";
// import usersDailyPoints from "../assets/usersDailyPoints.json";
import { PointTransaction } from "../database/models/pointTransaction";
import { checkGuildMember } from "../output/discord";
import { Loyalty } from "../database/models/loyaty";

// const secret = nconf.get("JWT_SECRET");

// const Contract = require("web3-eth-contract");
// import MAHAX from "../abi/MahaXAbi.json";
// Contract.setProvider(nconf.get("ETH_RPC"));
// const mahaXContract = new Contract(MAHAX, nconf.get("LOCKER_ADDRESS"));

//get user data
export const fetchUser = async (req: Request, res: Response) => {
  try {
    // const tokenData: any = await jwt.verify(req.params.id, secret);
    const user: any = await User.findOne({ userID: req.params.id }).select(
      "discordAvatar discordVerify signDiscord streak userTag userID walletAddress totalPoints signTwitter jwt"
    );
    if (user) {
      const verifyUser = await checkGuildMember(user.userID);
      user["discordVerify"] = verifyUser;
      await user.save();
      res.send(user);
    } else {
      res.send("not a valid user");
    }
  } catch (e) {
    console.log(e);
  }
};

//users leaderboard
export const getLeaderboard = async (req: Request, res: Response) => {
  const users: any = await User.find()
    .select("discordName totalPoints discordAvatar userID")
    .sort({ totalPoints: -1 });

  const allUsers: any = [];
  await Bluebird.mapSeries(users, async (user: any) => {
    const userLoyalty: any = await Loyalty.findOne({ userId: user._id });
    console.log(userLoyalty);

    const userResponse = {
      discordName: user.discordName,
      totalPoints: user.totalPoints,
      imageUrl: `https://cdn.discordapp.com/avatars/${user.userID}/${user.discordAvatar}`,
      loyaltyPoints: userLoyalty.totalLoyalty || 0,
    };
    allUsers.push(userResponse);
  });

  res.send(allUsers);
};

//get latest rewards of a user
export const getRecentRewards = async (req: any, res: Response) => {
  const user = req.user;
  try {
    const userDetails = await User.findOne({ _id: user.id });
    if (userDetails) {
      const recentRewards = await PointTransaction.find({
        userId: userDetails._id,
        addPoints: { $gt: 0 },
      }).select("type createdAt addPoints");
      res.send(recentRewards);
    }
  } catch (e) {
    console.log(e);
  }
};

//user points
export const getUsersDailyPoints = async (req: any, res: Response) => {
  const usersDailyPoints: any = [];
  const user = req.user;
  try {
    const userDetails = await User.findOne({ _id: user.id });
    if (userDetails) {
      const dailyPoints = await PointTransaction.find({
        userId: userDetails._id,
      }).select("totalPoints createdAt");
      if (dailyPoints.length > 0) {
        dailyPoints.map((item) => {
          usersDailyPoints.push([
            new Date(item.createdAt).getTime(),
            item.totalPoints,
          ]);
        });
      }
    }
    res.send(usersDailyPoints);
  } catch (e) {
    console.log(e);
  }
};

//connect wallet verify
export const walletVerify = async (req: any, res: any) => {
  try {
    const userReq = req.user;
    const userData = await User.findOne({ _id: userReq.id });

    if (userData) {
      const result = ethers.utils.verifyMessage(
        userData.userID || "",
        req.body.hash
      );
      if (result === req.body.address) {
        userData["walletAddress"] = req.body.address;
        userData["discordVerify"] = true;
        userData["signDiscord"] = true;
        await userData.save();
        const discordMsgEmbed = new MessageEmbed()
          .setColor("#F07D55")
          .setDescription("Congratulation your wallet has been connected");
        const payload = {
          embeds: [discordMsgEmbed],
        };
        sendMessage(nconf.get("CHANNEL_WALLET_CONNECT"), payload);
        res.send({ success: true });
      } else {
        res.send({ success: false });
      }
    } else {
      res.send({ success: false });
    }
  } catch (error) {
    console.log(error);
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
