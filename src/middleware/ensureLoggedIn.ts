import { IUserModel } from "../database/models/user";
import { NextFunction, Request, Response } from "express";
import NotAuthorizedError from "../errors/NotAuthorizedError";

export default (request: Request, _response: Response, next: NextFunction) => {
  if (!request.user) return next(new NotAuthorizedError());

  // avoid deleted users
  const user = request.user as IUserModel;
  // if (user.isDeleted) return next(new NotAuthorizedError());

  next();
};
