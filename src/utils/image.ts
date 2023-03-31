import * as web3 from "./web3";
import { contract } from "./web3";
import { sendRequest } from "../library/sendRequest";
import { imageComparing } from "../library/imageComparer";
import { ILoyaltyTaskModel } from "../database/models/loyaltyTasks";

export const profileImageComparing = async (
  task: ILoyaltyTaskModel,
  profileImageUrl: string,
  size: number,
  walletAddress: string
) => {
  // resize image for image comparing
  const { noOfNft, allTokenURI } = await contract(
    task.contractAddress,
    walletAddress
  );

  if (noOfNft == 0) return false;

  allTokenURI?.map(async (imgURI: string) => {
    const data = await sendRequest<string>("get", imgURI);
    const nftMetadata = JSON.parse(data);
    const response = await imageComparing(
      profileImageUrl,
      nftMetadata.image,
      size
    );
    return response;
  });

  // for (let i = 0; i < noOfNft; i++) {
  //   const nftId = await web3.tokenOfOwnerByIndex(walletAddress, i);
  //   const tokenUri = await web3.tokenURI(nftId);

  //   const data = await sendRequest<string>("get", tokenUri);
  //   const nftMetadata = JSON.parse(data);

  //   const response = await imageComparing(
  //     profileImageUrl,
  //     nftMetadata.image,
  //     size
  //   );

  //   if (response) return true;
  // }

  return false;
};
