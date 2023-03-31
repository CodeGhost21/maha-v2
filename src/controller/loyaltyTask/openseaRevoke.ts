import { ILoyaltyTaskModel } from "../../database/models/loyaltyTasks";
import { IServerProfile } from "../../database/models/serverProfile";
import { contract } from "../../utils/web3";
export const openseaLoyalty = async (
  task: ILoyaltyTaskModel,
  profile: IServerProfile
) => {
  const response = await contract(
    task.contractAddress,
    profile.userId.walletAddress,
    task.operatorAddress
  );
  // const response = await isOpenseaApproved(profile.userId.walletAddress);
  // return !response;
  return !response.isOpenseaApproved;
};
