import passport from "passport";
import nconf from "nconf";
import { Strategy } from "passport-discord";
import { IUserModel, User } from "../database/models/user";
import { checkGuildMember } from "../output/discord";
import urlJoin from "../utils/urlJoin";
import { Loyalty } from "../database/models/loyaty";

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

passport.use(
  new Strategy(
    {
      clientID: nconf.get("DISCORD_CLIENT_ID"),
      clientSecret: nconf.get("DISCORD_CLIENT_SECRET"),
      callbackURL: callbackURL,
      scope: ["identify"],
    },
    async (accessToken, refreshToken, profile, done) => {
      if (!profile) return done(new Error("no discord profile found"));

      const user = await User.findOne({ userID: profile.id });
      if (user) {
        const verifyUser = await checkGuildMember(user.userID);
        user.discordVerify = verifyUser;
        user.discordAvatar = profile.avatar || "";
        user.discordName = profile.username;

        user.discordOauthAccessToken = accessToken;
        user.discordOauthRefreshToken = refreshToken;

        // user.jwt = token;

        await user.save();
        const checkLoyalty = await Loyalty.findOne({ userId: user._id });
        if (!checkLoyalty) {
          const newLoyalty = new Loyalty({
            userId: user._id,
          });
          await newLoyalty.save();
        }
        done(null, user);
      } else {
        const verifyUser = await checkGuildMember(profile.id);
        const newUser = await User.create({
          userID: profile.id,
          userTag: `${profile.username}#${profile.discriminator}`,
          discordName: profile.username,
          discordDiscriminator: profile.discriminator,
          discordAvatar: profile.avatar,
          discordVerify: verifyUser,

          discordOauthAccessToken: accessToken,
          discordOauthRefreshToken: refreshToken,
        });

        const newLoyalty = new Loyalty({
          userId: newUser.id,
        });
        await newLoyalty.save();

        // save a jwt token with a 7 day expiry
        // const token = await jwt.sign({ id: newUser.id, expiry }, jwtSecret);

        await newUser.save();
        done(null, newUser);
      }
    }
  )
);
