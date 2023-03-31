import * as web3 from "./web3";
import { contract } from "./web3";
import { sendRequest } from "../library/sendRequest";
import { imageComparing } from "../library/imageComparer";
import { ILoyaltyTaskModel } from "../database/models/loyaltyTasks";
import Bluebird from "bluebird";

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
