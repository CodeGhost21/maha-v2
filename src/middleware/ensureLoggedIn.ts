import { NextFunction, Response, Request } from "express";
import NotAuthorizedError from "../errors/NotAuthorizedError";

export default (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new NotAuthorizedError());
  next();
};
