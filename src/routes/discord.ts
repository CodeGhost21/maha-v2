import jwt from "jsonwebtoken";
import { Router } from "express";
import nconf from "nconf";
import passport from "passport";

import urlJoin from "../utils/url-join";
import { WalletUser } from "../database/models/walletUsers";
import { checkGuildMember } from "../output/discord";
import { assignPoints } from "../controller/user";

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
    const isFollow = await checkGuildMember(req.user.id);
    if (isFollow) {
      user.discordFollow = true;
      await assignPoints(user, 100, "Discord Follower", true, {
        taskId: "discordFollowPoints",
        points: 100,
      });
    }
    user.discordId = req.user.id;
    user.discordVerify = true;
    user.discordFollowChecked = isFollow;
    await user.save();
    res.redirect(urlJoin(nconf.get("FRONTEND_URL"), `/#/`));
  }
);

export default router;
