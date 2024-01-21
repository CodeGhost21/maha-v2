import { IAppRequest } from "../utils/interfaces";
import { Response, NextFunction } from "express";
import { WalletUser } from "../database/models/walletUsers";
import jwt from "jsonwebtoken";
import nconf from "nconf";
import passport from "passport";

// The JWT secret, which is used to sign/verify the JWT
const secret = nconf.get("JWT_SECRET");

function deserializeUser(
  request: IAppRequest,
  _response: Response,
  next: NextFunction
) {
  const token = request.header("x-jwt");
  // If the token doesn't exist, we skip
  if (!token) return next();

  // If it does, then we verify it first
  jwt.verify(
    token,
    secret,
    (error: jwt.VerifyErrors, payload: jwt.JwtPayload) => {
      // If there was some error, we don't try to set the user
      if (error) return next();

      // Once we've extracted the payload from it, we'll try to query to the
      // DB to find the user for this session and attach it to the request.

      WalletUser.findById(payload.id)
        .then((user) => {
          // avoid deleted users
          // if (user && user) throw new BadRequestError("deleted user");

          request.user = user;
          next();
        })
        .catch(next);
    }
  );
}

export default [passport.session(), deserializeUser];
