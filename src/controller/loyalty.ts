import nconf from "nconf";
const Jimp = require("jimp");
const Contract = require("web3-eth-contract");
// const fs = require("fs");

import MAHAX from "../abi/MahaXAbi.json";
import { Loyalty } from "../database/models/loyaty";
import { User } from "../database/models/user";

Contract.setProvider(nconf.get("ETH_RPC"));

const mahaXContract = new Contract(MAHAX, nconf.get("LOCKER_ADDRESS"));
const profileImageComparing = async (
  profileImageUrl: string,
  size: number,
  walletAddress: string
) => {
  //resize image for image comparing
  // const noOfNFTs = await mahaXContract.methods.balanceOf(walletAddress).call();
  // console.log(noOfNFTs);
  // for (let i = 0; i < noOfNFTs; i++) {
  //   const nftId = await mahaXContract.methods
  //     .tokenOfOwnerByIndex(walletAddress, i)
  //     .call();
  //   const tokenUri = await mahaXContract.methods.tokenURI(nftId).call();
  // console.log(tokenUri);
  const resizeNFT = await Jimp.read(
    "https://peopleofeden.s3.amazonaws.com/NFT/01b87d5d5f971679ddc6d58a281c5629.png"
  );
  resizeNFT.resize(size, size).write("rewards/resizeNFT.png");
  const nftUrl = `${nconf.get("ROOT_PATH")}/rewards/resizeNFT.png`;

  const nftImage = await Jimp.read(nftUrl);
  const profile = await Jimp.read(profileImageUrl);

  const diff = Jimp.diff(nftImage, profile);
  // fs.unlinkSync(nftUrl);
  if (diff.percent <= 0.4) {
    return true;
  }
  // }
  return false;
};

export const checkTask = async (req: any, res: any) => {
  try {
    const user = await User.findOne({ _id: req.user.id });
    if (user) {
      const userLoyalty: any = await Loyalty.findOne({ userId: user._id });
      if (req.body.task === "gm") {
        if (user.totalGMs > 0) {
          userLoyalty["gm"] = true;
          userLoyalty["totalLoyalty"] = userLoyalty.totalLoyalty + 0.25;
          await userLoyalty.save();
        }
      } else if (req.body.task === "twitterProfile") {
        const twitterResponse = await profileImageComparing(
          user.twitterProfileImg,
          48,
          user.walletAddress
        );
        if (twitterResponse) {
          userLoyalty["twitterProfile"] = true;
          userLoyalty["totalLoyalty"] = userLoyalty.totalLoyalty + 0.25;
          await userLoyalty.save();
        }
      } else if (req.body.task === "discordProfile") {
        const discordResponse = await profileImageComparing(
          `https://cdn.discordapp.com/avatars/${user.userID}/${user.discordAvatar}`,
          128,
          user.walletAddress
        );
        if (discordResponse) {
          userLoyalty["discordProfile"] = true;
          userLoyalty["totalLoyalty"] = userLoyalty.totalLoyalty + 0.25;
          await userLoyalty.save();
        }
      } else if (req.body.task === "intro") {
      } else if (req.body.task === "opensea") {
        const operator = nconf.get("OPERATOR");
        console.log(operator, user.walletAddress);
        const response = await mahaXContract.methods
          .isApprovedForAll(user.walletAddress, operator)
          .call();
        if (!response) {
          userLoyalty["opensea"] = true;
          userLoyalty["totalLoyalty"] = userLoyalty.totalLoyalty + 0.25;
          await userLoyalty.save();
        }
      }
      res.send(userLoyalty);
    }
  } catch (e) {
    console.log(e);
  }
};

export const getLoyalty = async (req: any, res: any) => {
  try {
    const userLoyalty = await Loyalty.findOne({ userId: req.user.id });
    res.send(userLoyalty);
  } catch (e) {
    console.log(e);
  }
};
