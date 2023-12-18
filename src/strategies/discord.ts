import { Strategy } from "passport-discord";
import nconf from "nconf";
import passport from "passport";
import urlJoin from "../utils/url-join";
// import User from "../database/models/users";
console.log(nconf.get("DISCORD_CLIENT_ID"));

passport.use(
  new Strategy(
    {
      clientID: nconf.get("DISCORD_CLIENT_ID"),
      clientSecret: nconf.get("DISCORD_CLIENT_SECRET"),
      callbackURL: urlJoin(nconf.get("HOST_URL"), "/discord/callback"),
      scope: ["identify"],
    },
    async (accessToken, refreshToken, profile, done) => {
      // console.log(profile);

      // Handle user information and authentication here
      //   const discordSchema: IOauthSchema = {
      //     name: profile.username,
      //     userId: profile.id,
      //     accessToken,
      //     refreshToken,
      //     avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.jpg`,
      //   };
      //   const user = await User.findOne({
      //     "discord.userId": profile.id,
      //     isDeleted: false,
      //   });
      //   if (user) return done(null, user);
      //   const newUser = await User.create({
      //     discord: discordSchema,
      //   });
      return done(null, profile);
    }
  )
);
