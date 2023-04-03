import { ILoyaltyTaskModel } from "../../database/models/loyaltyTasks";
import { IServerProfile } from "../../database/models/serverProfile";
import { isOpenseaApproved } from "../../utils/web3";

export const openseaLoyalty = async (
  task: ILoyaltyTaskModel,
  profile: IServerProfile
) => {
  const user = await profile.getUser();
  const response = await isOpenseaApproved(
    task.contractAddress,
    user.walletAddress,
    task.operatorAddress
  );
  return !response;
};
