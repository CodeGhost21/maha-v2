import { Request } from "express";
import { IUserModel } from "./database/models/user";

export interface PassportRequest extends Request {
  user: IUserModel;
}
