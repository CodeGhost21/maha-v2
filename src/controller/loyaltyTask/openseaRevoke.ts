import { IServerProfile } from "../../database/models/serverProfile";
import { isOpenseaApproved } from "../../utils/web3";

export const openseaLoyalty = async (profile: IServerProfile) => {
  const response = await isOpenseaApproved(profile.userId.walletAddress);
  return !response;
};
