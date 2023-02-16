import * as jwt from "jsonwebtoken";
import nconf from "nconf";

import InvalidJWTError from "../errors/InvalidJWTError";

const secret = nconf.get("JWT_SECRET");

export const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const jwtHeader = req.headers["x-jwt"];

  const token = jwtHeader
    ? jwtHeader
    : authHeader
    ? authHeader.split(" ")[1]
    : null;

  if (token) {
    jwt.verify(token, secret, (err: any, user: any) => {
      if (err) return next(new InvalidJWTError());
      if (err) return next();
      req.user = user;
      next();
    });
  } else next();
};
