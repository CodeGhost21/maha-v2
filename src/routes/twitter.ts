import jwt from "jsonwebtoken";
import { Router } from "express";
import nconf from "nconf";
import passport from "passport";

import urlJoin from "../utils/url-join";

const secret = nconf.get("JWT_SECRET");
const router = Router();

router.get("/verify", (_req, res, next) => {
  const token: any = _req.query.jwt;
  jwt.verify(
    token,
    secret,
    async (error: jwt.VerifyErrors, payload: jwt.JwtPayload) => {
      //@ts-ignore
      _req.session.userId = payload.id;
      if (error) return next();
      passport.authenticate("twitter", {
        successRedirect: urlJoin(nconf.get("HOST_URL"), `/twitter/callback`),
      })(_req, res, next);
    }
  );
});

router.get(
  "/callback",
  passport.authenticate("twitter"),
  async (req: any, res) => {
    // const user: any = await WalletUser.findOne({ _id: req.query.state });
    // console.log("mongo user ", user);
    // console.log("twitterId", req.user.id);

    // user.twitterId = req.user.id;
    // user.twitterVerify = true;
    // await user.save();
    res.redirect(urlJoin(nconf.get("FRONTEND_URL"), `/#/`));
  }
);

export default router;
