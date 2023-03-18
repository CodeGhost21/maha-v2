import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import nconf from "nconf";

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
    jwt.verify(token, secret, {}, (err, decoded) => {
      if (err) return next(new InvalidJWTError());
      if (err) return next();

      console.log("jwt", decoded);
      // req.user = user;
      next();

      console.log(decoded);
    });
  } else next();
};
