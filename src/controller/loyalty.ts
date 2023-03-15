import nconf from "nconf";
const Contract = require("web3-eth-contract");
import MAHAX from "../abi/MahaXAbi.json";
import { Loyalty } from "../database/models/loyaty";
import { User } from "../database/models/user";
import { sendRequest } from "../library/sendRequest";
import { updateTwitterProfile } from "./user";
import { imageComparing } from "../library/imageComparer";
Contract.setProvider(nconf.get("ETH_RPC"));

const mahaXContract = new Contract(MAHAX, nconf.get("CONTRACT_LOCKER"));
const profileImageComparing = async (
  profileImageUrl: string,
  size: number,
  walletAddress: string
) => {
  //resize image for image comparing
  const noOfNFTs = await mahaXContract.methods.balanceOf(walletAddress).call();
  if (noOfNFTs > 0) {
    for (let i = 0; i < noOfNFTs; i++) {
      const nftId = await mahaXContract.methods
        .tokenOfOwnerByIndex(walletAddress, i)
        .call();
      const tokenUri = await mahaXContract.methods.tokenURI(nftId).call();
      const nftMetadata: any = await sendRequest("get", tokenUri);
      const parseNftMetadata = JSON.parse(nftMetadata);
      const response = await imageComparing(
        profileImageUrl,
        parseNftMetadata.image,
        size
      );
      if (response) {
        return true;
      }
      // return response;
      // const resizeNFT = await Jimp.read(parseNftMetadata.image);
      // resizeNFT.resize(size, size).write("rewards/resizeNFT.jpg");
      // const nftUrl = `${nconf.get("ROOT_PATH")}/rewards/resizeNFT.jpg`;

      // const nftImage = await Jimp.read(nftUrl);
      // const profile = await Jimp.read(profileImageUrl);

      // const diff = Jimp.diff(nftImage, profile);
      // if (diff.percent <= 0.4) {
      //   return true;
      // }
    }
  }
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
        }
      } else if (req.body.task === "intro") {
      } else if (req.body.task === "opensea") {
        const operator = nconf.get("OPERATOR");
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
    // console.log(e);
    res.send({});
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
