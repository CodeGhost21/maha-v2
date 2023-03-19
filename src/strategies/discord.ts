import passport from "passport";
import nconf from "nconf";
import { Strategy as DiscordStrategy, Profile } from "passport-discord";
import { IUserModel, User } from "../database/models/user";
import { checkGuildMember } from "../utils/discord";
import urlJoin from "../utils/urlJoin";

// @ts-ignore
passport.serializeUser<string>((user: IUserModel, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (e) {
    console.log(e);
    done(e);
  }
});

const callbackURL = urlJoin(nconf.get("DOMAIN"), "/discord/redirect");

type callbackParams = { expires_in: number };
const callback = async (
  accessToken: string,
  refreshToken: string,
  params: callbackParams,
  profile: Profile,
  done: (err?: Error | null, user?: Express.User, info?: object) => void
) => {
  if (!profile) return done(new Error("no discord profile found"));

  const accessTokenExpiry = new Date(Date.now() + params.expires_in * 1000);

  const user = await User.findOne({ userID: profile.id });
  if (user) {
    const verifyUser = await checkGuildMember(user.userID);
    user.discordVerify = verifyUser;
    user.discordAvatar = profile.avatar || "";
    user.discordName = profile.username;

    user.discordOauthAccessToken = accessToken;
    user.discordOauthRefreshToken = refreshToken;
    user.discordOauthAccessTokenExpiry = accessTokenExpiry;

    await user.save();
    done(null, user);
  } else {
    const verifyUser = checkGuildMember(profile.id);
    const newUser = await User.create({
      userID: profile.id,
      userTag: `${profile.username}#${profile.discriminator}`,
      discordName: profile.username,
      discordDiscriminator: profile.discriminator,
      discordAvatar: profile.avatar,
      discordVerify: verifyUser,

      discordOauthAccessToken: accessToken,
      discordOauthRefreshToken: refreshToken,
      discordOauthAccessTokenExpiry: accessTokenExpiry,
    });

    done(null, newUser);
  }
};

passport.use(
  new DiscordStrategy(
    {
      clientID: nconf.get("DISCORD_CLIENT_ID"),
      clientSecret: nconf.get("DISCORD_CLIENT_SECRET"),
      callbackURL: callbackURL,
      scope: ["identify"],
    },
    callback
  )
);
