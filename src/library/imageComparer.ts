import hat from "hat";
import nconf from "nconf";
import path from "path";
import jimp from "jimp";
import fs from "fs";

export const imageComparing = async (
  profileURL: string,
  nftURL: string,
  size: number
) => {
  const profileImage = await jimp.read(profileURL);
  const nft = await jimp.read(nftURL);

  const randomPath = `/tmp/resizeImage-${hat()}.png`;
  const resizePath = path.join(nconf.get("DOMAIN"), randomPath);
  const resizeNFT = await nft.resize(size, size).writeAsync(resizePath);

  //   hash
  // const profileHash = profileImage.hash();
  // const nftHash = resizeNFT.hash();
  //   distance
  // const distance = await Jimp.distance(profileImage, resizeNFT);
  //difference
  // console.log(profileImage, resizeNFT);

  const diff = await jimp.diff(profileImage, resizeNFT);
  console.log("img compare", profileURL, nftURL, diff.percent);

  fs.unlinkSync(resizePath);
  return diff.percent <= 0.15;
};
