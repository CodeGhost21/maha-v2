import * as web3 from "./web3";
import { sendRequest } from "../library/sendRequest";
import { imageComparing } from "../library/imageComparer";
import Bluebird from "bluebird";

export const profileImageComparing = async (
  addr: string,
  profileImageUrl: string,
  size: number,
  walletAddress: string
) => {
  // resize image for image comparing
  const noOfNFTs = await web3.balanceOf(addr, walletAddress);

  if (noOfNFTs == 0) return false;

  const allTokenURI = await web3.tokenURI(addr, walletAddress);
  const imageCompareResponse: any = [];
  await Bluebird.mapSeries(allTokenURI, async (imgURI: string) => {
    const data = await sendRequest<string>("get", imgURI);
    const nftMetadata = JSON.parse(data);
    const response = await imageComparing(
      profileImageUrl,
      nftMetadata.image,
      size
    );
    imageCompareResponse.push(response);
  });

  if (imageCompareResponse.includes(true)) return true;
  return false;
};
