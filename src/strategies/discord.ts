import { Strategy } from "passport-discord";
import nconf from "nconf";
import passport from "passport";
import urlJoin from "../utils/url-join";

passport.use(
  new Strategy(
    {
      clientID: nconf.get("DISCORD_CLIENT_ID"),
      clientSecret: nconf.get("DISCORD_CLIENT_SECRET"),
      callbackURL: urlJoin(nconf.get("FRONTEND_URL"), "/#/discord/callback"),
      scope: ["identify"],
    },
    async (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);
