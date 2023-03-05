import nconf from "nconf";
const Jimp = require("jimp");
const Contract = require("web3-eth-contract");
// const fs = require("fs");

import MAHAX from "../abi/MahaXAbi.json";
import { User } from "../database/models/user";

Contract.setProvider(nconf.get("ETH_RPC"));

const mahaXContract = new Contract(MAHAX, nconf.get("LOCKER_ADDRESS"));

export const profileImageComparing = async (
  profileImageUrl: string,
  size: number
) => {
  //resize image for image comparing
  const resizeNFT = await Jimp.read(
    "https://peopleofeden.s3.amazonaws.com/NFT/01b87d5d5f971679ddc6d58a281c5629.png"
  );
  resizeNFT.resize(size, size).write("rewards/resizeNFT.png");
  const nftUrl = `${nconf.get("ROOT_PATH")}/rewards/resizeNFT.png`;

  const nftImage = await Jimp.read(nftUrl);
  const profile = await Jimp.read(profileImageUrl);

  const diff = Jimp.diff(nftImage, profile);
  // fs.unlinkSync(nftUrl);
  if (diff.percent >= 0.4) {
    return false;
  }
  return true;
};

export const checkTask = async (req: any, res: any) => {
  console.log(req.body);
  const user = await User.findOne({ _id: req.user.id });
  if (user) {
    if (req.body.task === "gm") {
      if (user.totalGMs > 0) res.send({ success: true });
      else res.send({ success: false });
    } else if (req.body.task === "twitterProfile") {
      const twitterResponse = await profileImageComparing(
        user.twitterProfileImg,
        48
      );
      res.send({ success: twitterResponse });
    } else if (req.body.task === "discordProfile") {
      const discordResponse = await profileImageComparing(
        `https://cdn.discordapp.com/avatars/${user.userID}/${user.discordAvatar}`,
        128
      );
      res.send({ success: discordResponse });
    } else if (req.body.task === "intro") {
      res.send({ success: true });
    } else if (req.body.task === "opensea") {
      const operator = nconf.get("OPERATOR");
      console.log(operator, user.walletAddress);
      const response = await mahaXContract.methods
        .isApprovedForAll(user.walletAddress, operator)
        .call();
      res.send({ success: !response });
    }
  }
};

// twitterProfileCheck();

//https://cdn.discordapp.com/avatars/400536328774746122/4551bfc5fdc861e460a1e45397703860
