import { IServerProfile } from "../../database/models/serverProfile";
import { profileImageComparing } from "../../utils/image";
import { fetchTwitterProfile } from "../user";

export const twitterProfileLoyalty = async (profile: IServerProfile) => {
  const user = await profile.getUser();
  const twitterProfile = await fetchTwitterProfile(user);
  const twitterCheck = await profileImageComparing(
    twitterProfile,
    48,
    user.walletAddress
  );
  return twitterCheck;
};
