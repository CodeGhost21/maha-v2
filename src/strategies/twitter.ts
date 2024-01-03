import { Strategy as TwitterStrategy } from "passport-twitter";
import nconf from "nconf";
import passport from "passport";
import urlJoin from "../utils/url-join";

passport.use(
  new TwitterStrategy(
    {
      consumerKey: nconf.get("TWITTER_CONSUMER_KEY"),
      consumerSecret: nconf.get("TWITTER_CONSUMER_SECRET"),
      callbackURL: urlJoin(nconf.get("HOST_URL"), "/twitter/callback"),
    },
    async (token: any, tokenSecret: any, profile: any, done: any) => {
      return done(null, profile);
    }
  )
);
