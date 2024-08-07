import { IAppRequest } from "../utils/interfaces";
import { Response, NextFunction } from "express";
import { WalletUser } from "../database/models/walletUsers";
import cache from "../utils/cache";
import jwt from "jsonwebtoken";
import nconf from "nconf";
import passport from "passport";

// The JWT secret, which is used to sign/verify the JWT
const secret = nconf.get("JWT_SECRET");
const CACHE_EXPIRATION_SECONDS = 3600;

async function deserializeUser(
  request: IAppRequest,
  _response: Response,
  next: NextFunction
) {
  const token = request.header("x-jwt");
  // If the token doesn't exist, we skip
  if (!token) return next();

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    const userIdKey = `userId:${payload.id}`;

    // Check if user data exists in cache
    let user = cache.get(userIdKey);
    console.log("cache data", user);

    if (!user) {
      // Fetch user data from the database if not found in cache
      user = await WalletUser.findById(payload.id);
      console.log("non cache data", user);

      if (!user) {
        // If the user doesn't exist in the database, skip
        return next();
      }
      // Cache the user data
      cache.set(userIdKey, user, CACHE_EXPIRATION_SECONDS);
    } else {
      user = WalletUser.hydrate(user);
    }
    // Attach user data to the request
    request.user = user;
    next();
  } catch (error) {
    return next();
  }
}

export default [passport.session(), deserializeUser];
