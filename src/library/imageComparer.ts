import nconf from "nconf";
import path from "path";
const Jimp = require("jimp");
const fs = require("fs");

export const imageComparing = async (
  profileURL: string,
  nftURL: string,
  size: number
) => {
  const profileImage = await Jimp.read(profileURL);
  const nft = await Jimp.read(nftURL);
  const resizePath = path.join(
    nconf.get("ROOT_PATH"),
    `/rewards/resizeImage.png`
  );
  const resizeNFT = await nft.resize(size, size).writeAsync(resizePath);
  //   hash
  // const profileHash = profileImage.hash();
  // const nftHash = resizeNFT.hash();
  //   distance
  // const distance = await Jimp.distance(profileImage, resizeNFT);
  //difference
  const diff = await Jimp.diff(profileImage, resizeNFT);
  console.log(diff);

  fs.unlinkSync(resizePath);
  if (diff.percentage > 0.15) {
    return false;
  }
  return true;
};
