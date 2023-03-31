import { ILoyaltyTaskModel } from "../../database/models/loyaltyTasks";
import { IServerProfile } from "../../database/models/serverProfile";
import { profileImageComparing } from "../../utils/image";
import { fetchDiscordProfile } from "../user";

export const discordProfileLoyalty = async (
  task: ILoyaltyTaskModel,
  profile: IServerProfile
) => {
  const user = await profile.getUser();

  const discordProfile: any = await fetchDiscordProfile(user);
  const discordCheck = await profileImageComparing(
    task,
    discordProfile,
    48,
    user.walletAddress
  );
  return discordCheck;
};
