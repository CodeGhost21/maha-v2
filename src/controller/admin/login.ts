import { NextFunction, Request, Response } from "express";
import passport from "passport";
import nconf from "nconf";
import * as jwt from "jsonwebtoken";
import urlJoin from "../../utils/urlJoin";
import { IUserModel } from "../../database/models/user";

const jwtSecret = nconf.get("JWT_SECRET");
const successRedirect = urlJoin(nconf.get("DOMAIN"), "/discord/redirect");

export const loginWithDiscord = passport.authenticate("discord", {
  successRedirect,
});

export const verifyWithDiscord = [
  passport.authenticate("discord"),
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next();

    const expiry = Date.now() + 86400000 * 7;

    const user = req.user as IUserModel;

    const token = await jwt.sign({ id: user.id, expiry }, jwtSecret);

    const frontendUrl = urlJoin(
      nconf.get("FRONTEND_URL"),
      `#/settings?token=${token}`
    );

    res.redirect(frontendUrl);
  },
];
