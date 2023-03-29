const DiscordOauth2 = require("discord-oauth2");
import { IServerProfile } from "../../database/models/serverProfile";
import { IUserModel } from "../../database/models/user";
import { profileImageComparing } from "../../utils/image";

const oauth = new DiscordOauth2();

const fetchDiscordProfile = async (user: IUserModel) => {
  // nothing
  const response = await oauth.getUser(user.discordOauthAccessToken);
  user["discordAvatar"] = response.avatar;
  user.save();
  return response.avatar;
};

export const discordProfileLoyalty = async (profile: IServerProfile) => {
  const user = await profile.getUser();

  const discordProfile = await fetchDiscordProfile(user);
  const discordCheck = await profileImageComparing(
    discordProfile,
    48,
    user.walletAddress
  );
  return discordCheck;
};
