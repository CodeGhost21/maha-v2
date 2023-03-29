import { IServerProfile } from "../../database/models/serverProfile";

export const gmLoyalty = async (profile: IServerProfile) => {
  if (profile.totalGMs > 0) return true;
  return false;
};
