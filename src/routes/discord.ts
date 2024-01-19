import jwt from "jsonwebtoken";
import { Router } from "express";
import nconf from "nconf";
import passport from "passport";

import urlJoin from "../utils/url-join";
import { WalletUser } from "../database/models/walletUsers";
import { checkGuildMember } from "../output/discord";
import { assignPoints } from "../controller/user";
import { points } from "../controller/constants";

const secret = nconf.get("JWT_SECRET");
const router = Router();

router.get("/verify", (_req, res, next) => {
  const token: any = _req.query.jwt;
  jwt.verify(
    token,
    secret,
    (error: jwt.VerifyErrors, payload: jwt.JwtPayload) => {
      if (error) return next();
      passport.authenticate("discord", {
        successRedirect: urlJoin(nconf.get("HOST_URL"), `/discord/callback`),
        state: payload.id,
      })(_req, res, next);
    }
  );
});

router.get(
  "/callback",
  passport.authenticate("discord"),
  async (req: any, res) => {
    const user: any = await WalletUser.findOne({ _id: req.query.state });
    const discordUser = await WalletUser.findOne({ discordId: req.user.id });
    console.log("35", discordUser);

    let url = `/#?error=409`;
    if (!discordUser) {
      const isFollow = await checkGuildMember(req.user.id);
      if (isFollow) {
        user.discordFollowChecked = true;
        await assignPoints(
          user,
          points.discordFollow,
          "Discord Follower",
          true,
          "discordFollow"
        );
      }
      user.discordId = req.user.id;
      user.discordVerify = true;
      user.discordFollowChecked = isFollow;
      await user.save();
      url = `/#/`;
    }

    res.redirect(urlJoin(nconf.get("FRONTEND_URL"), url));
  }
);

export default router;
