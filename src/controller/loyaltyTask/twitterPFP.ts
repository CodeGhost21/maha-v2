import { ILoyaltyTaskModel } from "../../database/models/loyaltyTasks";
import { IServerProfile } from "../../database/models/serverProfile";
import { profileImageComparing } from "../../utils/image";
import { fetchTwitterProfile } from "../user";

export const twitterProfileLoyalty = async (
  task: ILoyaltyTaskModel,
  profile: IServerProfile
) => {
  const user = await profile.getUser();
  const twitterProfile = await fetchTwitterProfile(user);

  const twitterCheck = await profileImageComparing(
    task.contractAddress,
    twitterProfile,
    48,
    user.walletAddress
  );
  return twitterCheck;
};
