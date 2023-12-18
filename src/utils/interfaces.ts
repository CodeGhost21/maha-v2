import { Request } from "express";
// import { IUserModel } from '../database/models/users'

export type IAppRequest = Request & { user: any; session: any };
