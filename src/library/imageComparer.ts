import nconf from "nconf";
import path from "path";
const Jimp = require("jimp");

export const imageComparing = async (
  profileURL: string,
  nftURL: string,
  size: number
) => {
  const profileImage = await Jimp.read(profileURL);
  const nft = await Jimp.read(nftURL);
  const resizePath = path.join(
    nconf.get("ROOT_PATH"),
    `/rewards/}resizeImage.png`
  );
  const resizeNFT = await nft.resize(size, size).write(resizePath);

  //   hash
  const example1Hash = profileImage.hash();
  const example2Hash = resizeNFT.hash();
  //   console.log("hash", example1Hash === example2Hash);

  //   distance
  const distance = await Jimp.distance(profileImage, resizeNFT);
  //   console.log("distance", distance);

  const diff = await Jimp.diff(profileImage, resizeNFT);
  //   console.log("difference", diff.percent);

  if (example1Hash !== example2Hash || distance > 0.15 || diff > 0.15) {
    return false;
  }
  return true;
};
