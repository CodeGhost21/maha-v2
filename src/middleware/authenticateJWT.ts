import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import nconf from "nconf";
import { User } from "../database/models/user";
import InvalidJWTError from "../errors/InvalidJWTError";

const secret = nconf.get("JWT_SECRET");

export const authenticateJWT = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const jwtHeader = req.header("x-jwt");

  const token = jwtHeader
    ? jwtHeader
    : authHeader
    ? authHeader.split(" ")[1]
    : null;

  if (token) {
    jwt.verify(token, secret, {}, async (err, decoded: any) => {
      if (err) return next(new InvalidJWTError());

      if (decoded.id) {
        if (Date.now() > decoded.expiry)
          return next(new InvalidJWTError("jwt expired"));

        const user = await User.findOne({ _id: String(decoded.id) });
        if (user) req.user = user;
      }

      next();
    });
  } else next();
};
