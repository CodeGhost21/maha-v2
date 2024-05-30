import "./discord";
// import "./twitter";
// import "./google";
import passport from "passport";

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));
