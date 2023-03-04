import passport from "passport";
import nconf from "nconf";
import * as jwt from "jsonwebtoken";
import { Strategy } from "passport-discord";
import { IUserModel, User } from "../database/models/user";
import { checkGuildMember } from "../output/discord";

const accessTokenSecret = nconf.get("JWT_SECRET");

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

passport.use(
  new Strategy(
    {
      clientID: nconf.get("DISCORD_CLIENT_ID"),
      clientSecret: nconf.get("DISCORD_CLIENT_SECRET"),
      callbackURL: nconf.get("DISCORD_CALLBACK_URL"),
      scope: ["identify"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      if (profile) {
        const user = await User.findOne({ userID: profile.id });
        if (user) done(null, user);
        else {
          const verifyUser = await checkGuildMember(profile.id);
          // console.log("verifyUser", verifyUser);
          const newUser = new User({
            userID: profile.id,
            userTag: `${profile.username}#${profile.discriminator}`,
            discordName: profile.username,
            discordDiscriminator: profile.discriminator,
            discordAvatar: profile.avatar,
            discordVerify: verifyUser,
          });
          await newUser.save();

          // save a jwt token with a 7 day expiry
          const token = await jwt.sign(
            { id: String(newUser.id), expiry: Date.now() + 86400000 * 7 },
            accessTokenSecret
          );
          newUser.jwt = token;

          await newUser.save();
          done(null, newUser);
        }
      } else done(new Error("no discord profile found"));
    }
  )
);
