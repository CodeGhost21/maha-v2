import { Request } from "express";

import jwt from "jsonwebtoken";
import nconf from "nconf";
import {
  IServerProfileModel,
  ServerProfile,
} from "../database/models/serverProfile";
import InvalidJWTError from "../errors/InvalidJWTError";
import NotAuthorizedError from "../errors/NotAuthorizedError";

const secret = nconf.get("JWT_SECRET");

export const extractServerProfile = (req: Request) => {
  const authHeader = req.headers.authorization;
  const jwtHeader = req.header("x-jwt");

  const token = jwtHeader
    ? jwtHeader
    : authHeader
    ? authHeader.split(" ")[1]
    : null;

  if (!token) throw new NotAuthorizedError();

  return new Promise<IServerProfileModel>((resolve, reject) => {
    jwt.verify(token, secret, {}, async (err, _decoded) => {
      if (err) return reject(new InvalidJWTError());

      const decoded = _decoded as jwt.JwtPayload;

      if (decoded.id) {
        if (Date.now() > decoded.expiry)
          return reject(new InvalidJWTError("jwt expired"));

        const user = await ServerProfile.findOne({
          _id: String(decoded.id),
        });
        if (!user) reject(new NotAuthorizedError());
        else resolve(user);
      }
    });
  });
};
