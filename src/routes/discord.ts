import { Router } from "express";
import passport from "passport";
import nconf from "nconf";
import * as jwt from "jsonwebtoken";
import urlJoin from "../utils/urlJoin";

const router = Router();

const jwtSecret = nconf.get("JWT_SECRET");
const successRedirect = urlJoin(nconf.get("DOMAIN"), "/discord/redirect");

router.get(
  "/login",
  passport.authenticate("discord", {
    successRedirect,
  })
);

router.get(
  "/redirect",
  passport.authenticate("discord"),
  async (req, res, next) => {
    if (!req.user) return next();

    const expiry = Date.now() + 86400000 * 7;

    // @ts-ignore
    const userId = req.user.id;
    const token = await jwt.sign({ id: userId, expiry }, jwtSecret);

    const frontendUrl = urlJoin(
      nconf.get("FRONTEND_URL"),
      `#/profile?token=${token}`
    );
    res.redirect(frontendUrl);
  }
);

export default router;
