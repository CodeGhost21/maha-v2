import jwt from "jsonwebtoken";
import { Router } from "express";
import nconf from "nconf";
import passport from "passport";

import urlJoin from "../utils/url-join";
import { WalletUser } from "../database/models/walletUsers";
import { checkGuildMember } from "../output/discord";
import { points } from "../controller/quests/constants";
import { assignPoints } from "../controller/quests/assignPoints";

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

router.get("/callback", passport.authenticate("discord"), async (req, res) => {
  const reqUser = req.user as any;
  const user = await WalletUser.findById(req.query.state);
  const discordUser = await WalletUser.findOne({ discordId: reqUser.id });

  if (!user) return;
  let url = `/#?status=discord_error`;

  if (!discordUser) {
    const isFollow = await checkGuildMember(reqUser.id);
    if (isFollow) {
      user.checked.discordFollow = true;
      await assignPoints(
        user.id,
        points.discordFollow,
        "Discord Follower",
        true,
        "discordFollow"
      );
    }
    user.discordId = reqUser.id;
    user.checked.discordVerify = true;
    user.checked.discordFollow = isFollow;
    await user.save();

    url = `/#/tasks?status=discord_success`;
  }

  res.redirect(urlJoin(nconf.get("FRONTEND_URL"), url));
});

export default router;
