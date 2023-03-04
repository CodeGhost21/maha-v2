import nconf from "nconf";
const Jimp = require("jimp");
const Contract = require("web3-eth-contract");

import MAHAX from "../abi/MahaXAbi.json";
import { User } from "../database/models/user";

Contract.setProvider(nconf.get("ETH_RPC"));

const mahaXContract = new Contract(MAHAX, nconf.get("LOCKER_ADDRESS"));

export const profileImageComparing = async (profileImgaeUrl: string) => {
  const image1 = await Jimp.read(profileImgaeUrl);
  const image2 = await Jimp.read(profileImgaeUrl);
  const diff = Jimp.diff(image1, image2);
  if (Math.ceil(diff.percent) === 1) {
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
        user.twitterProfileImg
      );
      res.send({ success: twitterResponse });
    } else if (req.body.task === "discordProfile") {
      // const discordResponse = await profileImageComparing(user.discordAvatar);
      res.send({ success: true });
    } else if (req.body.task === "intro") {
      res.send({ success: true });
    } else if (req.body.task === "opensea") {
      const operator = nconf.get("OPERATOR");
      const response = await mahaXContract.methods
        .isApprovedForAll(user.walletAddress, operator)
        .call();
      res.send({ success: response });
    }
  }
};

// twitterProfileCheck();
