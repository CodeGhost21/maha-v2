import * as web3 from "./web3";
import { sendRequest } from "../library/sendRequest";
import { imageComparing } from "../library/imageComparer";

export const profileImageComparing = async (
  addr: string,
  profileImageUrl: string,
  size: number,
  walletAddress: string
) => {
  // resize image for image comparing
  const noOfNFTs = await web3.balanceOf(addr, walletAddress);

  if (noOfNFTs == 0) return false;

  for (let i = 0; i < noOfNFTs; i++) {
    const nftId = await web3.tokenOfOwnerByIndex(walletAddress, i);
    const tokenUri = await web3.tokenURI(nftId);

    const data = await sendRequest<string>("get", tokenUri);
    const nftMetadata = JSON.parse(data);

    const response = await imageComparing(
      profileImageUrl,
      nftMetadata.image,
      size
    );

    if (response) return true;
  }

  return false;
};
